import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export function SiteHeader() {
  return (
    <header className="border-b border-[#d8d5cd] bg-[#fffefa]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Wordmark />
        <nav className="flex items-center gap-1 text-sm" aria-label="Primary">
          <Link href="/close" className="inline-flex min-h-11 items-center rounded-md px-3 font-semibold text-[#25262a]">
            Board
          </Link>
          <Link href="/audit" className="inline-flex min-h-11 items-center rounded-md px-3 font-semibold text-[#25262a]">
            3P audit
          </Link>
          <Link href="/trial" className="n86-btn-primary">
            Free seat
          </Link>
        </nav>
      </div>
    </header>
  );
}
