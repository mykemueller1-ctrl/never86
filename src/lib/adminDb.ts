import { opsDb, opsDbConfigured } from './opsDb';

export type DailyFocus = {
  id: number;
  author: string;
  entry_date: string;
  body: string;
  status: string | null;
  updated_at: string;
};

export type AeoDraft = {
  id: number;
  author: string;
  title: string;
  slug: string | null;
  question: string | null;
  answer: string;
  audience: string | null;
  status: string;
  updated_at: string;
};

export type TeamNote = {
  id: number;
  author: string;
  kind: string;
  title: string | null;
  body: string;
  note_date: string;
};

export type PipelineRow = {
  id: number;
  operator_name: string;
  contact_name: string | null;
  units: number | null;
  stage: string;
  notes: string | null;
  next_step: string | null;
  next_step_date: string | null;
  updated_at: string;
};

export type QuickWin = {
  id: number;
  name: string;
  slug: string;
  audience: string | null;
  pitch: string;
  status: string;
  demo_url: string | null;
};

export type Lead = {
  id: number;
  email: string;
  name: string | null;
  restaurant_name: string | null;
  units: number | null;
  source_page: string | null;
  status: string;
  next_step: string | null;
  created_at: string;
};

export type VisitorEventRow = {
  id: number;
  session_id: string | null;
  event_type: string;
  page_path: string | null;
  agent_name: string | null;
  audience: string | null;
  created_at: string;
};

export type AgentRollup = {
  agent_name: string;
  views: number;
  last_seen: string;
};

export type OutboundTarget = {
  id: number;
  operator: string;
  units: number | null;
  hq_city: string | null;
  cuisine: string | null;
  founder_or_ceo: string | null;
  fit_reason: string | null;
  source_url: string | null;
  priority: number | null;
  status: string;
  sent_at: string | null;
  replied_at: string | null;
  template_used: string | null;
  notes_internal: string | null;
};

export type OutboundTemplate = {
  id: number;
  name: string;
  subject: string;
  body: string;
  angle: string | null;
  word_count: number | null;
};

export type AdminSnapshot = {
  focus: DailyFocus[];
  aeo: AeoDraft[];
  team: TeamNote[];
  pipeline: PipelineRow[];
  quickWins: QuickWin[];
  leads: Lead[];
  events: VisitorEventRow[];
  agentRollup: AgentRollup[];
  outboundTargets: OutboundTarget[];
  outboundTemplates: OutboundTemplate[];
  configured: boolean;
};

export async function loadAdminSnapshot(): Promise<AdminSnapshot> {
  if (!opsDbConfigured()) {
    return { focus: [], aeo: [], team: [], pipeline: [], quickWins: [], leads: [], events: [], agentRollup: [], outboundTargets: [], outboundTemplates: [], configured: false };
  }
  const sql = opsDb();
  const [focus, aeo, team, pipeline, quickWins, leads, events, agentRollup, outboundTargets, outboundTemplates] = await Promise.all([
    sql<DailyFocus[]>`SELECT id, author, entry_date::text, body, status, updated_at::text
                      FROM admin.daily_focus
                      ORDER BY entry_date DESC, id DESC
                      LIMIT 25`,
    sql<AeoDraft[]>`SELECT id, author, title, slug, question, answer, audience, status, updated_at::text
                    FROM admin.aeo_drafts
                    ORDER BY updated_at DESC
                    LIMIT 25`,
    sql<TeamNote[]>`SELECT id, author, kind, title, body, note_date::text
                    FROM admin.team_notes
                    ORDER BY note_date DESC, id DESC
                    LIMIT 25`,
    sql<PipelineRow[]>`SELECT id, operator_name, contact_name, units, stage, notes, next_step, next_step_date::text, updated_at::text
                       FROM admin.operator_pipeline
                       ORDER BY updated_at DESC`,
    sql<QuickWin[]>`SELECT id, name, slug, audience, pitch, status, demo_url
                    FROM admin.quick_win_lineup
                    ORDER BY CASE status WHEN 'live' THEN 0 WHEN 'idea' THEN 1 ELSE 2 END, name`,
    sql<Lead[]>`SELECT id, email, name, restaurant_name, units, source_page, status, next_step, created_at::text
                FROM admin.leads
                ORDER BY created_at DESC
                LIMIT 50`,
    sql<VisitorEventRow[]>`SELECT id, session_id, event_type, page_path, agent_name, audience, created_at::text
                           FROM admin.visitor_events
                           ORDER BY created_at DESC
                           LIMIT 50`,
    sql<AgentRollup[]>`SELECT agent_name, COUNT(*)::int AS views, MAX(created_at)::text AS last_seen
                       FROM admin.visitor_events
                       WHERE agent_name IS NOT NULL
                       GROUP BY agent_name
                       ORDER BY views DESC, last_seen DESC
                       LIMIT 25`,
    sql<OutboundTarget[]>`SELECT id, operator, units, hq_city, cuisine, founder_or_ceo, fit_reason, source_url, priority, status,
                                 sent_at::text, replied_at::text, template_used, notes_internal
                          FROM admin.outbound_targets
                          ORDER BY CASE status
                            WHEN 'queued' THEN 0
                            WHEN 'sent' THEN 1
                            WHEN 'replied' THEN 2
                            WHEN 'passed' THEN 3
                            ELSE 4 END,
                            priority NULLS LAST, operator`,
    sql<OutboundTemplate[]>`SELECT id, name, subject, body, angle, word_count
                            FROM admin.outbound_templates
                            ORDER BY id`,
  ]);
  return { focus, aeo, team, pipeline, quickWins, leads, events, agentRollup, outboundTargets, outboundTemplates, configured: true };
}
