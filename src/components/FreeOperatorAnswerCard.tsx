import Link from 'next/link';
import {
  OWNER_SEAT_EOD,
  PUBLIC_PREVIEW_COPY,
  SAMPLE_LABEL,
  chipForSlug,
  type FreeOperatorAnswer,
} from '@/lib/freeOperatorDemo';

type AnswerLike = Pick<
  FreeOperatorAnswer,
  'slug' | 'headline' | 'facts' | 'coachTomorrow' | 'needs'
> & {
  tags?: string[];
  sourceTags?: Array<{ tag: string; source: string }>;
};

export function FreeOperatorAnswerCard({
  answer,
  compact = false,
  live = false,
}: {
  answer: AnswerLike;
  compact?: boolean;
  live?: boolean;
}) {
  const chip = chipForSlug(answer.slug);
  const tags = answer.tags?.length
    ? answer.tags
    : answer.sourceTags?.map((tag) => `${tag.tag}:${tag.source}`);

  return (
    <article aria-label={live ? 'Operator answer' : 'Sample operator answer'} className="owner-desk-card">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#003bb5]">
        {live ? 'Stored on this seat · source-tagged' : SAMPLE_LABEL}
      </p>
      {chip ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#0066ff]">{chip.label}</p>
      ) : null}
      {tags?.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="owner-desk-tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <h2 className={`mt-3 font-serif leading-[0.95] tracking-[-0.04em] text-[#06122b] ${compact ? 'text-[1.55rem]' : 'text-[2rem]'}`}>
        {answer.headline}
      </h2>
      {compact ? null : (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#3d4d73]">{PUBLIC_PREVIEW_COPY}</p>
      )}

      <section className="mt-6">
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#0066ff]">Facts</h3>
        <ul className="mt-3 space-y-2">
          {answer.facts.map((fact) => (
            <li key={fact} className="rounded-2xl border border-[#c5d4f5] bg-[#eef3ff] px-4 py-3 text-[15px] leading-relaxed text-[#06122b]">
              {fact}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-2xl border border-[#0066ff] bg-[#eef3ff] px-4 py-4">
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#0066ff]">
          Coach this tomorrow
        </h3>
        <p className="mt-2 text-[16px] leading-relaxed text-[#06122b]">{answer.coachTomorrow}</p>
      </section>

      <section className="mt-4 rounded-2xl border border-[#c5d4f5] bg-white px-4 py-4">
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#003bb5]">Needs</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-[#3d4d73]">{answer.needs}</p>
      </section>

      {compact && chip ? (
        <p className="mt-4">
          <Link href={`/operator/answers/${answer.slug}`} className="text-sm font-semibold text-[#0066ff]">
            Open this card →
          </Link>
        </p>
      ) : compact ? null : (
        <>
          <p className="mt-6 text-sm leading-relaxed text-[#3d4d73]">{OWNER_SEAT_EOD.copy}</p>
          <p className="mt-8">
            <Link href="/operator" className="human-button human-button-primary text-sm">
              ← Back to Owner desk
            </Link>
          </p>
        </>
      )}
    </article>
  );
}
