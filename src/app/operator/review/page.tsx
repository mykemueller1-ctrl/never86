import type { Metadata } from 'next';
import { readFile } from 'node:fs/promises';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { OperatorReviewDesk } from '@/components/OperatorReviewDesk';
import { localReviewEnabled } from '@/lib/operatorReviewTypes';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: "Local operator review | Never86'd", robots: { index: false, follow: false } };

const reviewSchema = z.object({
  workspaceName: z.string().max(120),
  location: z.string().max(120),
  source: z.object({ title: z.string().max(200), label: z.string().max(100), text: z.string().max(100000) }),
  rules: z.array(z.object({ id: z.string().max(80), title: z.string().max(150), detail: z.string().max(1500), section: z.string().max(150) })).max(30),
});

export default async function OperatorReviewPage() {
  const host = (await headers()).get('host');
  const dataPath = process.env.OPERATOR_REVIEW_DATA_PATH;
  // This is a localhost design review, never a login shortcut or a production seat.
  if (!localReviewEnabled(process.env.NODE_ENV, host, dataPath)) notFound();
  let data;
  try {
    data = reviewSchema.parse(JSON.parse(await readFile(dataPath!, 'utf8')));
  } catch {
    notFound();
  }
  return <OperatorReviewDesk data={data} />;
}
