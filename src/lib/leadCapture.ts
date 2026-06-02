import { opsDb, opsDbConfigured } from './opsDb';

export type LeadInput = {
  email: string;
  name?: string;
  restaurantName?: string;
  units?: number | null;
  role?: string;
  sourcePage?: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  requestedAgent?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
};

// Mirror a lead into admin.leads + queue 24h and 7d follow-ups.
// Safe to call alongside the public.waitlist insert in /api/waitlist.
export async function captureLead(input: LeadInput): Promise<{ leadId: number | null }> {
  if (!opsDbConfigured()) return { leadId: null };
  const sql = opsDb();
  try {
    const rows = await sql<{ id: number }[]>`
      INSERT INTO admin.leads (
        email, name, restaurant_name, units, role,
        source_page, referrer, user_agent, ip,
        utm_source, utm_medium, utm_campaign,
        requested_agent, unlocked_at
      ) VALUES (
        ${input.email.toLowerCase()},
        ${input.name ?? null},
        ${input.restaurantName ?? null},
        ${input.units ?? null},
        ${input.role ?? null},
        ${input.sourcePage ?? null},
        ${input.referrer ?? null},
        ${input.userAgent ?? null},
        ${input.ip ?? null},
        ${input.utm?.source ?? null},
        ${input.utm?.medium ?? null},
        ${input.utm?.campaign ?? null},
        ${input.requestedAgent ?? null},
        ${input.requestedAgent ? new Date() : null}
      )
      ON CONFLICT (LOWER(email)) DO UPDATE SET
        updated_at = NOW(),
        name = COALESCE(EXCLUDED.name, admin.leads.name),
        restaurant_name = COALESCE(EXCLUDED.restaurant_name, admin.leads.restaurant_name),
        units = COALESCE(EXCLUDED.units, admin.leads.units),
        source_page = COALESCE(EXCLUDED.source_page, admin.leads.source_page),
        requested_agent = COALESCE(EXCLUDED.requested_agent, admin.leads.requested_agent),
        unlocked_at = COALESCE(admin.leads.unlocked_at, EXCLUDED.unlocked_at)
      RETURNING id
    `;
    const leadId = rows[0]?.id ?? null;
    if (leadId) {
      // Queue follow-ups only if not already queued.
      await sql`
        INSERT INTO admin.followup_queue (lead_id, kind, scheduled_for, template)
        SELECT ${leadId}, '24h', NOW() + INTERVAL '24 hours', 'first_touch'
        WHERE NOT EXISTS (
          SELECT 1 FROM admin.followup_queue
          WHERE lead_id = ${leadId} AND kind = '24h'
        )
      `;
      await sql`
        INSERT INTO admin.followup_queue (lead_id, kind, scheduled_for, template)
        SELECT ${leadId}, '7d', NOW() + INTERVAL '7 days', 'second_touch'
        WHERE NOT EXISTS (
          SELECT 1 FROM admin.followup_queue
          WHERE lead_id = ${leadId} AND kind = '7d'
        )
      `;
    }
    return { leadId };
  } catch (err) {
    // Don't break the form submission path if admin DB is unreachable.
    console.error('captureLead failed:', err);
    return { leadId: null };
  }
}

export type VisitorEvent = {
  sessionId?: string;
  eventType: string; // 'view' | 'click' | 'agent_open' | 'agent_complete' | ...
  pagePath?: string;
  agentName?: string;
  audience?: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  meta?: Record<string, unknown>;
};

export async function logVisitorEvent(e: VisitorEvent): Promise<void> {
  if (!opsDbConfigured()) return;
  const sql = opsDb();
  try {
    await sql`
      INSERT INTO admin.visitor_events (
        session_id, event_type, page_path, agent_name, audience,
        referrer, user_agent, ip, meta
      ) VALUES (
        ${e.sessionId ?? null},
        ${e.eventType},
        ${e.pagePath ?? null},
        ${e.agentName ?? null},
        ${e.audience ?? null},
        ${e.referrer ?? null},
        ${e.userAgent ?? null},
        ${e.ip ?? null},
        ${e.meta ? JSON.stringify(e.meta) : null}::jsonb
      )
    `;
  } catch (err) {
    console.error('logVisitorEvent failed:', err);
  }
}
