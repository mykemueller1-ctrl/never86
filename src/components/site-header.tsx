import Link from "next/link";

export function SiteHeader({ tone = "dark" }: { tone?: "dark" | "board" }) {
  const bar = tone === "board" ? "border-[#24332d]" : "border-white/10";
  return (
    <header className={`border-b ${bar}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          Never<span className="text-[#f0c94a]">86</span>.ai
        </Link>
        <nav className="flex items-center gap-1 text-sm" aria-label="Primary">
          <Link href="/close" className="inline-flex min-h-11 items-center rounded-full px-3 text-[#d5ddd8] hover:text-white">
            Board
          </Link>
          <Link href="/audit" className="inline-flex min-h-11 items-center rounded-full px-3 text-[#d5ddd8] hover:text-white">
            3P audit
          </Link>
          <Link
            href="/trial"
            className="inline-flex min-h-11 items-center rounded-full bg-[#f0c94a] px-4 font-semibold text-[#1a1404] hover:bg-[#e2b93a]"
          >
            Free seat
          </Link>
        </nav>
      </div>
    </header>
  );
}
