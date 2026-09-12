import { NextRequest, NextResponse } from 'next/server';
import { opsDb, opsDbConfigured } from '@/lib/opsDb';
import { sendFollowupEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Drain the optional admin.followup_queue. Called by Vercel Cron.
// When the legacy ops database is not configured, this route is intentionally
// a healthy no-op: current public lead intake sends its immediate emails directly.
// If CRON_SECRET is configured, Vercel must send the matching Bearer token.

type QueueRow = {
  id: number;
  lead_id: number;
  kind: '24h' | '7d';
  email: string;
  name: string | null;
  requested_agent: string | null;
};

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  if (!opsDbConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'optional ops follow-up queue is not configured',
      processed: 0,
      sent: 0,
      failed: 0,
    });
  }

  const sql = opsDb();
  const due = await sql<QueueRow[]>`
    UPDATE admin.followup_queue q
       SET status = 'sending'
      FROM admin.leads l
     WHERE q.status = 'pending'
       AND q.scheduled_for <= NOW()
       AND q.lead_id = l.id
       AND l.email IS NOT NULL
    RETURNING q.id, q.lead_id, q.kind, l.email, l.name, l.requested_agent
  `;

  const results: Array<{ id: number; sent: boolean; error?: string }> = [];

  for (const row of due) {
    try {
      await sendFollowupEmail({
        to: row.email,
        firstName: row.name ?? undefined,
        agentName: row.requested_agent ?? undefined,
        kind: row.kind,
      });
      await sql`
        UPDATE admin.followup_queue
           SET status = 'sent', sent_at = NOW()
         WHERE id = ${row.id}
      `;
      if (row.kind === '24h') {
        await sql`UPDATE admin.leads SET followup_24h_sent_at = NOW() WHERE id = ${row.lead_id}`;
      } else {
        await sql`UPDATE admin.leads SET followup_7d_sent_at = NOW() WHERE id = ${row.lead_id}`;
      }
      results.push({ id: row.id, sent: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await sql`
        UPDATE admin.followup_queue
           SET status = 'failed', notes = ${msg.slice(0, 500)}
         WHERE id = ${row.id}
      `;
      results.push({ id: row.id, sent: false, error: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    skipped: false,
    processed: due.length,
    sent: results.filter((r) => r.sent).length,
    failed: results.filter((r) => !r.sent).length,
    results,
  });
}
