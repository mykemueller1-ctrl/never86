import { TAG_META, type TagLevel } from '@/lib/sourceTags';

// The pill that renders next to every metric. Green = Verified (re-pullable
// primary source), amber = Estimated (modeled/benchmark), gray = Unverified
// (scrape / stale / not-yet-wired). This is the honesty layer made visible.
export function SourceTag({ level, title }: { level: TagLevel; title?: string }) {
  const m = TAG_META[level];
  return (
    <span
      title={title}
      style={{ color: m.hex, backgroundColor: m.bg }}
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
    >
      {m.label}
    </span>
  );
}
