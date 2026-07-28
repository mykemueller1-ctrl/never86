import Anthropic from '@anthropic-ai/sdk';
import { parseModelJson } from './json';
import type { InvoiceLineItem } from '../db/schema';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export type ParsedInvoice = {
  vendorName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  totalAmount: number | null;
  category: string | null;
  lineItems: InvoiceLineItem[] | null;
};

export type ParsedZReport = {
  reportDate: string | null;
  grossSales: number | null;
  netSales: number | null;
  foodSales: number | null;
  liquorSales: number | null;
  beerSales: number | null;
  wineSales: number | null;
  laborCost: number | null;
  guestCount: number | null;
  checkAverage: number | null;
};

// ── Invoice OCR ──
export async function parseInvoice(text: string): Promise<ParsedInvoice> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an invoice parser for a restaurant. Extract structured data from this invoice text.

Return JSON only, no markdown:
{
  "vendorName": "string",
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "totalAmount": number,
  "category": "food" | "liquor" | "beer" | "wine" | "supplies" | "other",
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "unit": "string (cs, ea, lb, etc)",
      "unitPrice": number,
      "totalPrice": number,
      "category": "food" | "liquor" | "beer" | "wine" | "supplies" | "other"
    }
  ]
}

Invoice text:
${text}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return parseModelJson<ParsedInvoice>(content.text);
  }
  throw new Error('Unexpected response format');
}

// ── Z-Report Processing ──
export async function parseZReport(text: string): Promise<ParsedZReport> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a restaurant POS Z-Report parser. Extract end-of-day numbers from this report.

Return JSON only, no markdown:
{
  "reportDate": "YYYY-MM-DD",
  "grossSales": number,
  "netSales": number,
  "foodSales": number,
  "liquorSales": number,
  "beerSales": number,
  "wineSales": number,
  "laborCost": number,
  "guestCount": number,
  "checkAverage": number
}

If a field isn't in the report, use null. Calculate checkAverage as netSales/guestCount if not provided.

Z-Report text:
${text}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return parseModelJson<ParsedZReport>(content.text);
  }
  throw new Error('Unexpected response format');
}

// ── Morning Briefing Generator ──
export async function generateBriefing(data: {
  yesterdaySales: any;
  weekToDate: any;
  recentInvoices: any[];
  alerts: string[];
}) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a restaurant operations AI assistant for Never 86'd. Generate a morning briefing email.

Data:
${JSON.stringify(data, null, 2)}

Generate a concise, actionable morning briefing. Return HTML email content using this style:
- Background: #121212 (dark)
- Primary text: #ffffff
- Accent/numbers: #d4a017 (gold)
- Font: system-ui, -apple-system, sans-serif
- Keep it scannable — bold the numbers, short paragraphs
- Include: yesterday's revenue, food cost %, prime cost %, guest count, check average
- Flag anything off-target (food cost >32%, prime cost >62%, check avg below trailing)
- End with 1-2 actionable items for today

Return raw HTML only — no markdown fences, no explanation.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  throw new Error('Unexpected response format');
}
