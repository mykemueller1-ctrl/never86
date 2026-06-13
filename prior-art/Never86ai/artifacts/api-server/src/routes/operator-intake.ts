import { Router, type IRouter, type Request, type Response } from "express";
import { db, operatorZReports } from "@workspace/db";
import { operatorAuthMiddleware, type AuthRequest } from "../lib/operator-auth";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { trackLLMCall, extractAnthropicUsage } from "../lib/ai-usage-tracker";

const router: IRouter = Router();

const parseRateMap = new Map<string, { count: number; resetAt: number }>();
function checkParseRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = parseRateMap.get(key);
  if (!entry || now > entry.resetAt) {
    parseRateMap.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

const Z_REPORT_PROMPT = `You are an expert at reading restaurant end-of-day Z report data — from printed receipts, POS emails, or daily summaries from any system (Toast, Square, Aloha, Micros, Lightspeed, Clover, SpotOn, Revel, etc).

Extract the following fields and return ONLY valid JSON — no markdown, no explanation.

Return this exact structure:
{
  "reportDate": "string — the report date in YYYY-MM-DD format",
  "sales": number — total net sales / net revenue (after discounts, before tax), as a decimal,
  "foodCogs": number or null — food cost of goods sold in dollars if shown,
  "laborCost": number or null — total labor cost in dollars if shown,
  "covers": number or null — number of guests, covers, or transactions if shown,
  "notes": "string or null — any notable info: weather, events, day of week, etc"
}

RULES:
- sales = net sales (NOT gross, NOT total with tax). If only gross shown, subtract tax.
- foodCogs = food cost in DOLLARS, not percentage. If only a percentage shown, return null.
- laborCost = labor in DOLLARS. If only a percentage shown, return null.
- If reportDate cannot be determined, use today's date in YYYY-MM-DD format.
- Return null for any field that cannot be reliably determined from the provided text.
- Do not guess or fabricate numbers. Only extract what is clearly stated.`;

function calcAndBuild(
  operatorId: number,
  reportDate: string,
  sales: number,
  foodCogs: number | null,
  laborCost: number | null,
  covers: number | null,
  notes: string | null,
  noteSuffix = ""
) {
  const food = foodCogs ?? 0;
  const labor = laborCost ?? 0;
  const prime = food + labor;
  const foodPct = sales > 0 ? (food / sales) * 100 : 0;
  const laborPct = sales > 0 ? (labor / sales) * 100 : 0;
  const primePct = sales > 0 ? (prime / sales) * 100 : 0;
  return {
    operatorId,
    reportDate,
    sales: String(sales),
    foodCogs: String(food),
    laborCost: String(labor),
    primeCost: String(prime),
    foodCostPct: String(Math.round(foodPct * 100) / 100),
    laborCostPct: String(Math.round(laborPct * 100) / 100),
    primeCostPct: String(Math.round(primePct * 100) / 100),
    covers: covers ?? null,
    notes: noteSuffix ? `${notes ?? ""}${notes ? " " : ""}${noteSuffix}`.trim() : (notes ?? null),
  };
}

// POST /operator/z-reports/parse-text
// Accepts plain text (pasted from a POS email or report) and extracts Z report fields via Claude
router.post(
  "/operator/z-reports/parse-text",
  operatorAuthMiddleware,
  async (req: Request, res: Response) => {
    const opId = (req as AuthRequest).operatorId;
    if (!checkParseRateLimit(`text-${opId}`)) {
      res.status(429).json({ error: "Too many requests. Try again in an hour." });
      return;
    }

    const { text } = req.body as { text?: unknown };
    if (!text || typeof text !== "string" || text.trim().length < 5) {
      res.status(400).json({ error: "Please paste your Z report or email text first." });
      return;
    }
    if (text.length > 25000) {
      res.status(400).json({ error: "Text too long. Try pasting just the totals section of the report." });
      return;
    }

    try {
      const tracked = await trackLLMCall("intake-zreport", "claude-sonnet-4-6", async () => {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: `${Z_REPORT_PROMPT}\n\nHere is the Z report / end-of-day summary to parse:\n\n${text}`,
            },
          ],
        });
        return extractAnthropicUsage(message);
      }, opId);

      const raw = tracked.reply.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        res.status(422).json({
          error: "Couldn't extract numbers from that text. Make sure you paste the full Z report or email body.",
        });
        return;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      res.json(parsed);
    } catch (err) {
      console.error("Z report text parse error:", err);
      res.status(500).json({ error: "AI extraction failed. Please try again." });
    }
  }
);

// POST /operator/intake/email
// Inbound email webhook — compatible with Resend, Postmark, and Mailgun inbound formats.
// Operator's personal intake address: zreport+op{id}@updates.n86.app
// Once the domain is verified, wire this endpoint up as the inbound webhook target.
router.post("/operator/intake/email", async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, string>;

    // Normalize across Resend / Postmark / Mailgun
    const toAddress: string = body.to ?? body.To ?? body.recipient ?? "";
    const textContent: string = body.text ?? body.TextBody ?? body["body-plain"] ?? "";
    const htmlContent: string = body.html ?? body.HtmlBody ?? body["body-html"] ?? "";
    const subject: string = body.subject ?? body.Subject ?? "";

    // Extract operator ID from pattern: zreport+op{id}@updates.n86.app
    const opIdMatch = toAddress.match(/\+op(\d+)@/i);
    if (!opIdMatch) {
      console.warn("Email intake: could not identify operator from address:", toAddress);
      res.status(200).json({ received: true, processed: false, reason: "Operator not identified from address" });
      return;
    }

    const operatorId = parseInt(opIdMatch[1], 10);
    if (isNaN(operatorId)) {
      res.status(200).json({ received: true, processed: false, reason: "Invalid operator ID" });
      return;
    }

    // Prefer plain text; strip HTML tags as fallback
    const content =
      textContent.trim().length > 20
        ? textContent
        : htmlContent.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();

    if (!content || content.length < 20) {
      res.status(200).json({ received: true, processed: false, reason: "No usable content in email body" });
      return;
    }

    const tracked2 = await trackLLMCall("intake-email", "claude-sonnet-4-6", async () => {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `${Z_REPORT_PROMPT}\n\nEmail subject: ${subject}\n\nEmail body:\n${content.slice(0, 12000)}`,
          },
        ],
      });
      return extractAnthropicUsage(message);
    }, operatorId);

    const raw = tracked2.reply.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(200).json({ received: true, processed: false, reason: "No Z report data found in email" });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      reportDate?: string;
      sales?: number;
      foodCogs?: number | null;
      laborCost?: number | null;
      covers?: number | null;
      notes?: string | null;
    };

    if (!parsed.sales || parsed.sales <= 0) {
      res.status(200).json({ received: true, processed: false, reason: "No valid sales figure in email" });
      return;
    }

    const reportDate = parsed.reportDate ?? new Date().toISOString().slice(0, 10);
    const row = calcAndBuild(
      operatorId,
      reportDate,
      parsed.sales,
      parsed.foodCogs ?? null,
      parsed.laborCost ?? null,
      parsed.covers ?? null,
      parsed.notes ?? null,
      "[via email]"
    );

    await db.insert(operatorZReports).values(row);
    console.log(`Email intake: saved Z report for operator ${operatorId}, date ${reportDate}, sales $${parsed.sales}`);
    res.status(200).json({ received: true, processed: true, reportDate, sales: parsed.sales });
  } catch (err) {
    console.error("Email intake error:", err);
    // Always return 200 so email service doesn't retry infinitely
    res.status(200).json({ received: true, processed: false, reason: "Internal error" });
  }
});

export default router;
