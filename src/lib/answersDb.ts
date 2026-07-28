import { opsDb, opsDbConfigured } from './opsDb';

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
};

// Read-only public view of published AEO answers. Drives /answers and
// /answers/[slug]. Only returns rows where status = 'published'.
export async function listPublishedAnswers(): Promise<PublishedAnswer[]> {
  if (!opsDbConfigured()) return [];
  const sql = opsDb();
  const rows = await sql<PublishedAnswer[]>`
    SELECT id, slug, title, question, answer, audience, author,
           published_at::text AS "publishedAt", updated_at::text AS "updatedAt"
    FROM admin.aeo_drafts
    WHERE status = 'published' AND slug IS NOT NULL
    ORDER BY published_at DESC NULLS LAST, id DESC
  `;
  return rows;
}

export async function getPublishedAnswer(slug: string): Promise<PublishedAnswer | null> {
  if (!opsDbConfigured()) return null;
  const sql = opsDb();
  const rows = await sql<PublishedAnswer[]>`
    SELECT id, slug, title, question, answer, audience, author,
           published_at::text AS "publishedAt", updated_at::text AS "updatedAt"
    FROM admin.aeo_drafts
    WHERE status = 'published' AND slug = ${slug}
    LIMIT 1
  `;
  return rows[0] ?? null;
}
