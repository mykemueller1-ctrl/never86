/**
 * Square webhook receiver.
 *
 * - Verifies HMAC signature against SQUARE_WEBHOOK_SIGNATURE_KEY.
 * - Dispatches order/payment/refund events to a handler that re-pulls the
 *   day's Z-report for the affected operator + (optional) location row.
 *
 * Always responds 2xx quickly (Square retries on non-2xx). Verification
 * failures return 401; malformed bodies return 400.
 */
import type { Request, Response } from "express";
import { db, operatorUsers, operatorLocations, operatorSquareWebhookEvents } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";
import { decrypt, isEncryptionConfigured } from "./pos-encryption";
import { verifyWebhookSignature } from "./pos-connectors/square";
import { pullZReportForOperator } from "../routes/operator-pos";

interface SquareEvent {
  merchant_id?: string;
  type?: string;
  event_id?: string;
  created_at?: string;
  data?: {
    type?: string;
    id?: string;
    object?: Record<string, unknown> & {
      order?: { location_id?: string; created_at?: string; updated_at?: string };
      payment?: { location_id?: string; created_at?: string; updated_at?: string };
      refund?: { location_id?: string; created_at?: string; updated_at?: string };
    };
  };
}

const RELEVANT_PREFIXES = ["order.", "payment.", "refund."];

function notificationUrlForRequest(req: Request): string {
  // Prefer explicit env (most stable; matches what we registered with Square).
  if (process.env.SQUARE_WEBHOOK_URL) return process.env.SQUARE_WEBHOOK_URL;
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] || req.protocol;
  const host = (req.headers["x-forwarded-host"] as string | undefined) || req.get("host");
  return `${proto}://${host}${req.originalUrl}`;
}

function dateFromEvent(ev: SquareEvent): string {
  const obj = ev.data?.object || {};
  const ts =
    obj.order?.updated_at ||
    obj.order?.created_at ||
    obj.payment?.updated_at ||
    obj.payment?.created_at ||
    obj.refund?.updated_at ||
    obj.refund?.created_at ||
    ev.created_at ||
    new Date().toISOString();
  return new Date(ts).toISOString().split("T")[0];
}

function locationIdFromEvent(ev: SquareEvent): string | undefined {
  const obj = ev.data?.object || {};
  return obj.order?.location_id || obj.payment?.location_id || obj.refund?.location_id;
}

export async function handleSquareWebhookRequest(req: Request, res: Response): Promise<void> {
  const signature = req.headers["x-square-hmacsha256-signature"] as string | undefined;
  const rawBody: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? "");
  const url = notificationUrlForRequest(req);
  const sigValid = verifyWebhookSignature(url, rawBody, signature);

  if (!sigValid) {
    logger.warn({ url }, "Square webhook signature verification failed");
    res.status(401).json({ error: "invalid_signature" });
    return;
  }

  let event: SquareEvent;
  try {
    event = JSON.parse(rawBody.toString("utf8")) as SquareEvent;
  } catch {
    res.status(400).json({ error: "invalid_json" });
    return;
  }

  // Ack fast — handle the body asynchronously so Square never retries a slow handler.
  res.status(200).json({ received: true });

  const type = event.type ?? event.data?.type ?? "";
  if (!RELEVANT_PREFIXES.some((p) => type.startsWith(p))) {
    return;
  }

  // Persist the event row pre-dispatch so missed/failed events can be replayed.
  // Square retries non-2xx (and sometimes 2xx) deliveries — if we already saw
  // this event_id, only re-dispatch when the prior attempt did not succeed,
  // and bump the retry count so we have an audit trail.
  const eventId = event.event_id ?? `synthetic_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  let shouldDispatch = true;
  try {
    const existing = await db.select({
      status: operatorSquareWebhookEvents.status,
    }).from(operatorSquareWebhookEvents)
      .where(eq(operatorSquareWebhookEvents.eventId, eventId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(operatorSquareWebhookEvents).values({
        merchantId: event.merchant_id ?? null,
        eventType: type,
        eventId,
        payload: event as unknown as Record<string, unknown>,
        signatureValid: sigValid,
        status: "pending",
      }).onConflictDoNothing({ target: operatorSquareWebhookEvents.eventId });
    } else if (existing[0].status === "success") {
      // Already processed successfully — skip duplicate work but record the retry.
      await db.update(operatorSquareWebhookEvents).set({
        retryCount: sql`${operatorSquareWebhookEvents.retryCount} + 1`,
      }).where(eq(operatorSquareWebhookEvents.eventId, eventId));
      shouldDispatch = false;
    } else {
      // Prior attempt failed/skipped/pending — reset to pending and re-dispatch.
      await db.update(operatorSquareWebhookEvents).set({
        status: "pending",
        retryCount: sql`${operatorSquareWebhookEvents.retryCount} + 1`,
        errorMessage: null,
        processedAt: null,
      }).where(eq(operatorSquareWebhookEvents.eventId, eventId));
    }
  } catch (logErr) {
    logger.warn({ err: (logErr as Error).message, eventId }, "Failed to log Square webhook event row (continuing)");
  }

  if (!shouldDispatch) return;

  void dispatchSquareEvent(event, eventId).catch((err) => {
    logger.error({ err: (err as Error).message, eventId }, "Square webhook dispatch failed");
  });
}

async function markEventStatus(
  eventId: string | undefined,
  status: "success" | "failed" | "skipped",
  opts: { operatorId?: number | null; locationId?: number | null; errorMessage?: string | null; bumpRetry?: boolean } = {},
): Promise<void> {
  if (!eventId) return;
  try {
    const updates: Record<string, unknown> = {
      status,
      processedAt: new Date(),
    };
    if (opts.operatorId !== undefined) updates.operatorId = opts.operatorId;
    if (opts.locationId !== undefined) updates.locationId = opts.locationId;
    if (opts.errorMessage !== undefined) updates.errorMessage = opts.errorMessage;
    if (opts.bumpRetry) updates.retryCount = sql`${operatorSquareWebhookEvents.retryCount} + 1`;
    await db.update(operatorSquareWebhookEvents).set(updates)
      .where(eq(operatorSquareWebhookEvents.eventId, eventId));
  } catch {
    /* swallow — logging is best-effort */
  }
}

export async function dispatchSquareEvent(event: SquareEvent, eventId?: string): Promise<void> {
  const evId = eventId ?? event.event_id;
  if (!isEncryptionConfigured()) {
    logger.warn("Skipping Square webhook dispatch — encryption not configured");
    await markEventStatus(evId, "skipped", { errorMessage: "encryption_not_configured" });
    return;
  }
  const merchantId = event.merchant_id;
  if (!merchantId) {
    logger.warn({ eventId: evId }, "Square webhook missing merchant_id");
    await markEventStatus(evId, "skipped", { errorMessage: "missing_merchant_id" });
    return;
  }
  const date = dateFromEvent(event);
  const sqLocationId = locationIdFromEvent(event);

  try {
    // Try the operatorLocations table first — preferred for multi-location ops.
    if (sqLocationId) {
      const locs = await db.select().from(operatorLocations);
      for (const loc of locs) {
        if (!loc.posType || loc.posType !== "square" || !loc.posCredentials) continue;
        try {
          const creds = JSON.parse(decrypt(loc.posCredentials)) as Record<string, string>;
          if (creds.merchantId === merchantId && (!creds.locationId || creds.locationId === sqLocationId)) {
            await pullZReportForOperator(loc.operatorId, "square", creds, date, loc.id);
            await db.update(operatorLocations).set({ posSyncStatus: "ok", updatedAt: new Date() })
              .where(eq(operatorLocations.id, loc.id));
            logger.info({ operatorId: loc.operatorId, locationId: loc.id, date, type: event.type }, "Square webhook processed (location)");
            await markEventStatus(evId, "success", { operatorId: loc.operatorId, locationId: loc.id });
            return;
          }
        } catch {
          /* keep scanning */
        }
      }
    }

    // Fallback: operator-level credential row.
    const ops = await db.select().from(operatorUsers).where(eq(operatorUsers.posType, "square"));
    for (const op of ops) {
      if (!op.posCredentials) continue;
      try {
        const creds = JSON.parse(decrypt(op.posCredentials)) as Record<string, string>;
        if (creds.merchantId === merchantId) {
          await pullZReportForOperator(op.id, "square", creds, date);
          await db.update(operatorUsers).set({ posSyncStatus: "ok", posLastSyncedAt: new Date() })
            .where(eq(operatorUsers.id, op.id));
          logger.info({ operatorId: op.id, date, type: event.type }, "Square webhook processed (operator)");
          await markEventStatus(evId, "success", { operatorId: op.id });
          return;
        }
      } catch {
        /* keep scanning */
      }
    }

    logger.warn({ merchantId, eventId: evId }, "Square webhook: no matching operator credential found");
    await markEventStatus(evId, "failed", { errorMessage: "no_matching_operator_credential" });
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    logger.error({ err: msg, eventId: evId }, "Square webhook dispatch threw");
    await markEventStatus(evId, "failed", { errorMessage: msg });
    throw err;
  }
}

/**
 * Replay a previously-logged webhook event. Used by the admin replay endpoint.
 * Resets the row's status to pending, increments retry count, and re-dispatches.
 */
export async function replayWebhookEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  const [row] = await db.select().from(operatorSquareWebhookEvents)
    .where(eq(operatorSquareWebhookEvents.eventId, eventId)).limit(1);
  if (!row) return { ok: false, error: "not_found" };
  await db.update(operatorSquareWebhookEvents).set({
    status: "pending",
    retryCount: sql`${operatorSquareWebhookEvents.retryCount} + 1`,
    errorMessage: null,
    processedAt: null,
  }).where(eq(operatorSquareWebhookEvents.eventId, eventId));
  try {
    await dispatchSquareEvent(row.payload as SquareEvent, eventId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
