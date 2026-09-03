import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FreeOperatorAnswerCard } from '@/components/FreeOperatorAnswerCard';
import {
  FREE_OPERATOR_ANSWERS,
  SAMPLE_LABEL,
  getFreeOperatorAnswer,
} from '@/lib/freeOperatorDemo';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return FREE_OPERATOR_ANSWERS.map((answer) => ({ slug: answer.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const answer = getFreeOperatorAnswer(slug);
  if (!answer) return { title: "Operator sample | Never 86'd", robots: { index: false, follow: false } };
  return {
    title: `${answer.headline} · ${SAMPLE_LABEL}`,
    description: `${SAMPLE_LABEL}. ${answer.needs}`,
    robots: { index: false, follow: false },
  };
}

export default async function OperatorAnswerPage({ params }: { params: Params }) {
  const { slug } = await params;
  const answer = getFreeOperatorAnswer(slug);
  if (!answer) notFound();

  return (
    <main className="human-page min-h-screen">
      <div className="operator-phone">
        <FreeOperatorAnswerCard answer={answer} />
      </div>
    </main>
  );
}
