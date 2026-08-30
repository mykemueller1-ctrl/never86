import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Terms · Never 86'd",
  description:
    "Terms for the public Never 86'd MCP and website. Read-only. Draft-only. Unverified is not a guarantee.",
  alternates: { canonical: 'https://www.never86.ai/terms' },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">
              Never 86{"'"}d <span className="italic text-ink-600">· terms</span>
            </p>
            <p className="compass-eyebrow-dim mt-2">Public MCP · website</p>
          </span>
        </Link>
      </div>

      <article className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <p className="compass-eyebrow mb-6">— Terms</p>
        <h1 className="compass-display text-5xl md:text-6xl mb-8">
          Public pack. <em>Read-only.</em>
        </h1>
        <p className="compass-body text-lg mb-10">
          Last updated August 28, 2026. Never 86{"'"}d Inc.
        </p>

        <div className="space-y-8 compass-body text-base">
          <section>
            <h2 className="font-serif text-2xl text-[#1d1d1f] mb-3">What you get</h2>
            <p>
              The public MCP at https://www.never86.ai/api/mcp returns restaurant operating math and copyable drafts. ChatGPT, Claude, Gemini, and Grok are thin shells over that backend. They are not four products.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-[#1d1d1f] mb-3">Rules</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>READ-ONLY first. DRAFT-ONLY second. You review and send any vendor or service message.</li>
              <li>Unverified figures stay Unverified. Missing Evidence is not $0.</li>
              <li>Variance is not theft, discipline, a contract finding, or guaranteed savings.</li>
              <li>Do not paste passwords, PANs, or staff SSNs into the public pack.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-[#1d1d1f] mb-3">No warranty</h2>
            <p>
              Public tools are provided as-is for operators who type their own numbers. We do not promise recovered cash, marketplace refunds, or a listed plugin until a directory says so.
            </p>
          </section>
        </div>

        <p className="compass-body mt-12 text-sm">
          <Link href="/privacy" className="font-semibold text-[#0066ff] hover:underline">Privacy</Link>
          {' · '}
          <Link href="/llm-shells" className="font-semibold text-[#0066ff] hover:underline">Try in four LLMs</Link>
        </p>
      </article>
    </main>
  );
}
