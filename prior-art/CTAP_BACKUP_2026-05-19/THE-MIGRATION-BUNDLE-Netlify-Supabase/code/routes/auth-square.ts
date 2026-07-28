/**
 * Square OAuth one-click connect.
 *
 *   GET  /api/auth/square/start     → 302 redirect to Square authorize page.
 *   GET  /api/auth/square/callback  → exchanges `code`, stores encrypted creds,
 *                                      302 to <DASHBOARD_URL>/settings?square_connected=true.
 *
 * State is HMAC-SHA256 signed and carries the operator id + a 10-min TTL.
 * Falls back gracefully with a 503 if SQUARE_CLIENT_ID/SECRET aren't configured.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { db, operatorUsers, operatorLocations } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { operatorAuthMiddleware, type AuthRequest } from "../lib/operator-auth";
import { encrypt, isEncryptionConfigured } from "../lib/pos-encryption";
import { logger } from "../lib/logger";
import * as square from "../lib/pos-connectors/square";

const router: IRouter = Router();
const STATE_TTL_MS = 10 * 60 * 1000;

function stateSecret(): string {
  const secret = process.env.POS_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Cannot sign OAuth state: POS_ENCRYPTION_KEY (or SESSION_SECRET) is required");
  }
  return secret;
}

function signState(payload: string): string {
  return crypto.createHmac("sha256", stateSecret()).update(payload).digest("hex");
}

// State payload format: `${operatorId}:${locationId|0}:${issuedAt}:${nonce}:${sig}`
export function makeState(operatorId: number, locationId?: number | null): string {
  const issuedAt = Date.now();
  const loc = locationId && Number.isFinite(locationId) ? String(locationId) : "0";
  const payload = `${operatorId}:${loc}:${issuedAt}:${crypto.randomBytes(8).toString("hex")}`;
  const sig = signState(payload);
  return Buffer.from(`${payload}:${sig}`, "utf8").toString("base64url");
}

export function verifyState(state: string): { operatorId: number; locationId: number | null } | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 5) return null;
    const [opIdStr, locIdStr, issuedAtStr, nonce, sig] = parts;
    const expected = signState(`${opIdStr}:${locIdStr}:${issuedAtStr}:${nonce}`);
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    const issuedAt = Number(issuedAtStr);
    if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > STATE_TTL_MS) return null;
    const opId = Number(opIdStr);
    if (!Number.isFinite(opId)) return null;
    const locId = Number(locIdStr);
    return { operatorId: opId, locationId: Number.isFinite(locId) && locId > 0 ? locId : null };
  } catch {
    return null;
  }
}

function dashboardBase(): string {
  const fromEnv = process.env.DASHBOARD_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const dom = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
  return dom ? `https://${dom}/zero86d` : "/zero86d";
}

router.get("/auth/square/start", operatorAuthMiddleware, async (req: Request, res: Response) => {
  if (!square.isOauthConfigured()) {
    res.status(503).json({ success: false, message: "Square OAuth is not configured on this server. Set SQUARE_CLIENT_ID, SQUARE_CLIENT_SECRET, and SQUARE_REDIRECT_URI." });
    return;
  }
  const op = (req as AuthRequest).operator;

  let locationId: number | null = null;
  const rawLocId = (req.query.locationId ?? req.query.location_id) as string | undefined;
  if (rawLocId) {
    const parsed = parseInt(rawLocId, 10);
    if (!Number.isFinite(parsed)) {
      res.status(400).json({ success: false, message: "Invalid locationId" });
      return;
    }
    // Verify the location belongs to this operator before encoding into state.
    const [loc] = await db.select().from(operatorLocations)
      .where(and(eq(operatorLocations.id, parsed), eq(operatorLocations.operatorId, op.id)))
      .limit(1);
    if (!loc) {
      res.status(404).json({ success: false, message: "Location not found" });
      return;
    }
    locationId = loc.id;
  }

  const state = makeState(op.id, locationId);
  const url = square.buildAuthorizeUrl(state);
  res.json({ authUrl: url, locationId });
});

// Square calls this with `code` and `state` in the query string. No auth header
// here — the operator's session is encoded in the signed state.
router.get("/auth/square/callback", async (req: Request, res: Response) => {
  const dashUrl = dashboardBase();
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const errorCode = req.query.error as string | undefined;

  if (errorCode) {
    logger.warn({ error: errorCode }, "Square OAuth callback returned error");
    res.redirect(`${dashUrl}/settings?square_error=${encodeURIComponent(errorCode)}`);
    return;
  }

  if (!code || !state) {
    res.redirect(`${dashUrl}/settings?square_error=missing_code`);
    return;
  }

  const verified = verifyState(state);
  if (!verified) {
    res.redirect(`${dashUrl}/settings?square_error=invalid_state`);
    return;
  }

  if (!isEncryptionConfigured()) {
    res.redirect(`${dashUrl}/settings?square_error=encryption_not_configured`);
    return;
  }

  try {
    const creds = await square.exchangeCodeForTokens(code);
    const encrypted = encrypt(JSON.stringify(creds));

    // Register a webhook subscription so order/payment/refund events flow in
    // real-time. Best-effort: failure does not block the connection.
    let subscriptionId: string | null = null;
    try {
      const webhookUrl = process.env.SQUARE_WEBHOOK_URL
        || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}/api/webhooks/square` : null);
      if (webhookUrl) {
        const sub = await square.createWebhookSubscription(creds, webhookUrl);
        subscriptionId = sub?.id ?? null;
      }
    } catch (subErr) {
      logger.warn({ err: (subErr as Error).message }, "Square webhook subscription registration failed (continuing)");
    }

    if (verified.locationId) {
      // Per-location credential row.
      await db.update(operatorLocations).set({
        posType: "square",
        posCredentials: encrypted,
        posSyncStatus: "ok",
        posWebhookSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      }).where(and(
        eq(operatorLocations.id, verified.locationId),
        eq(operatorLocations.operatorId, verified.operatorId),
      ));
      logger.info({
        operatorId: verified.operatorId, locationId: verified.locationId,
        env: creds.environment, merchantId: creds.merchantId, subscriptionId,
      }, "Square OAuth connected (location)");
    } else {
      await db.update(operatorUsers).set({
        posType: "square",
        posCredentials: encrypted,
        posConnectedAt: new Date(),
        posSyncStatus: "ok",
        posLastSyncedAt: null,
        posWebhookSubscriptionId: subscriptionId,
      }).where(eq(operatorUsers.id, verified.operatorId));
      logger.info({
        operatorId: verified.operatorId, env: creds.environment,
        merchantId: creds.merchantId, subscriptionId,
      }, "Square OAuth connected");
    }

    const params = new URLSearchParams({ square_connected: "true" });
    if (verified.locationId) params.set("location_id", String(verified.locationId));
    res.redirect(`${dashUrl}/settings?${params.toString()}`);
  } catch (err) {
    const msg = (err as Error).message ?? "";
    logger.error({ operatorId: verified.operatorId, error: msg }, "Square OAuth token exchange failed");
    // Clamp PLAINTEXT first (so we can never split a percent-escape) then encode once.
    const safe = msg.replace(/[^\x20-\x7E]/g, "").slice(0, 140) || "token_exchange_failed";
    res.redirect(`${dashUrl}/settings?square_error=${encodeURIComponent(safe)}`);
  }
});

export default router;
