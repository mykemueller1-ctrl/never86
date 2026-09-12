import type { Metadata } from 'next';
import Link from 'next/link';
import { HumanSiteFooter, HumanSiteHeader } from '@/components/HumanSiteShell';

export const metadata: Metadata = {
  title: "Support | Never86'd",
  description: "Support for Never86'd owner seats, the public MCP connector, privacy requests, and account access.",
  alternates: { canonical: 'https://www.never86.ai/support' },
  robots: { index: false, follow: true },
};

export default function SupportPage() {
  return (
    <main className="human-page min-h-screen">
      <HumanSiteHeader />
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="human-kicker">Never86&apos;d support</p>
          <h1 className="mt-5 font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-[#171717] md:text-7xl">
            Bring the issue.
            <span className="block italic text-[#005de8]">Keep sensitive files out of email.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#514b43]">
            Use this support route for owner-seat access, public MCP connector problems, privacy or deletion requests, and product issues. Do not email passwords, owner PINs, API tokens, payment-card data, employee medical information, or unredacted financial files.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <article className="human-receipt-card p-6">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#005de8]">Product / account</p>
              <h2 className="mt-4 font-serif text-3xl text-[#1b1b1b]">Owner seat or connector issue</h2>
              <p className="mt-4 text-sm leading-relaxed text-[#5b554d]">
                Describe the store, account email, affected page or AI client, and what you expected to happen. Redact restaurant-sensitive material before sending screenshots.
              </p>
              <a href="mailto:myke@never86.ai?subject=Never86d%20Support" className="mt-6 inline-flex font-semibold text-[#005de8] hover:underline">
                Email Never86&apos;d support →
              </a>
            </article>

            <article className="human-receipt-card p-6">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#005de8]">Privacy / data</p>
              <h2 className="mt-4 font-serif text-3xl text-[#1b1b1b]">Access, correction, export, deletion</h2>
              <p className="mt-4 text-sm leading-relaxed text-[#5b554d]">
                Identify the account and request without attaching sensitive originals. Never86&apos;d will verify account or store ownership before acting on a data request.
              </p>
              <Link href="/privacy" className="mt-6 inline-flex font-semibold text-[#005de8] hover:underline">
                Read the privacy policy →
              </Link>
            </article>
          </div>

          <div className="human-receipt-card mt-4 p-6">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#005de8]">AI connector boundaries</p>
            <p className="mt-4 text-sm leading-relaxed text-[#5b554d]">
              The public MCP at <code>https://www.never86.ai/api/mcp</code> is read-only and only analyzes information a user deliberately supplies to the AI client. The authenticated Never86&apos;d Operator app is a separate tenant-private product. Support will never ask you to paste private restaurant credentials into the public connector.
            </p>
          </div>
        </div>
      </section>
      <HumanSiteFooter />
    </main>
  );
}
