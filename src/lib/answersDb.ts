import { opsDb, opsDbConfigured } from './opsDb';
import { getBuiltInAnswer, OPERATOR_ANSWERS, type AnswerSource } from './operatorAnswers';

export type PublishedAnswer = {
  id: number;
  slug: string;
  title: string;
  question: string | null;
  answer: string;
  audience: string | null;
  author: string;
  publishedAt: string | null;
  updatedAt: string;
  summary?: string;
  keywords?: string[];
  sources?: AnswerSource[];
  category?: string;
  week?: number;
  formula?: string;
  fieldChecks?: string[];
  evidenceNeeded?: string[];
  evidenceBoundary?: string;
  relatedSlugs?: string[];
  tryUrl?: string;
  tryLabel?: string;
};

// Read-only public view of published AEO answers. Drives /answers and
// /answers/[slug]. Only returns rows where status = 'published'.
export async function listPublishedAnswers(): Promise<PublishedAnswer[]> {
  if (!opsDbConfigured()) return OPERATOR_ANSWERS;
  try {
    const sql = opsDb();
    const rows = await sql<PublishedAnswer[]>`
      SELECT id, slug, title, question, answer, audience, author,
             published_at::text AS "publishedAt", updated_at::text AS "updatedAt"
      FROM admin.aeo_drafts
      WHERE status = 'published' AND slug IS NOT NULL
      ORDER BY published_at DESC NULLS LAST, id DESC
    `;
    const merged = new Map<string, PublishedAnswer>(OPERATOR_ANSWERS.map((answer) => [answer.slug, answer]));
    for (const row of rows) merged.set(row.slug, { ...merged.get(row.slug), ...row });
    return Array.from(merged.values());
  } catch (error) {
    console.error('Published answer database unavailable; serving built-in corpus.', error);
    return OPERATOR_ANSWERS;
  }
}

export async function getPublishedAnswer(slug: string): Promise<PublishedAnswer | null> {
  const builtIn = getBuiltInAnswer(slug);
  if (!opsDbConfigured()) return builtIn;
  try {
    const sql = opsDb();
    const rows = await sql<PublishedAnswer[]>`
      SELECT id, slug, title, question, answer, audience, author,
             published_at::text AS "publishedAt", updated_at::text AS "updatedAt"
      FROM admin.aeo_drafts
      WHERE status = 'published' AND slug = ${slug}
      LIMIT 1
    `;
    return rows[0] ? { ...builtIn, ...rows[0] } : builtIn;
  } catch (error) {
    console.error(`Published answer database unavailable for slug "${slug}"; serving built-in answer.`, error);
    return builtIn;
  }
}
