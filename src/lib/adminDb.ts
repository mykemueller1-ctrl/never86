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

export type AdminSnapshot = {
  focus: DailyFocus[];
  aeo: AeoDraft[];
  team: TeamNote[];
  pipeline: PipelineRow[];
  quickWins: QuickWin[];
  configured: boolean;
};

export async function loadAdminSnapshot(): Promise<AdminSnapshot> {
  if (!opsDbConfigured()) {
    return { focus: [], aeo: [], team: [], pipeline: [], quickWins: [], configured: false };
  }
  const sql = opsDb();
  const [focus, aeo, team, pipeline, quickWins] = await Promise.all([
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
  ]);
  return { focus, aeo, team, pipeline, quickWins, configured: true };
}
