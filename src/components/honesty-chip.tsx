import type { EvidenceLabel } from "@/lib/close/money";

const TONE: Record<EvidenceLabel, string> = {
  Verified: "border-[#86efac] bg-[#e7f7ee] text-[#166534]",
  Estimated: "border-[#fdba74] bg-[#fff2e8] text-[#9a3412]",
  Missing: "border-[#cbd5e1] bg-[#eef1f5] text-[#334155]",
};

export function HonestyChip({ label }: { label: EvidenceLabel }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.07em] ${TONE[label]}`}>
      {label}
    </span>
  );
}
