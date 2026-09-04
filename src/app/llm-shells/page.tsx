import Link from 'next/link';
import type { Metadata } from 'next';
import { MCP_PUBLIC_ENDPOINT } from '@/lib/mcpPublicContract';
import { CopyMcpUrl } from './CopyMcpUrl';

export const metadata: Metadata = {
  title: "Try Never86'd in ChatGPT",
  description:
    "Connect Never86'd to ChatGPT and inspect Payroll, Prices, and Process with the same read-only operator tools.",
  alternates: { canonical: 'https://www.never86.ai/llm-shells' },
  robots: { index: true, follow: true },
};

const STARTERS = [
  'Analyze this labor CSV and show me the three biggest schedule-versus-actual review leads.',
  'Read this invoice CSV SKU by SKU and show me every price increase over 5%.',
  'Build today\'s Action Shift from my prior-day close. No more than three moves.',
];

export default function LlmShellsPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">Never86&apos;d · ChatGPT</p>
            <p className="compass-eyebrow-dim mt-2">Payroll · Prices · Process</p>
          </span>
        </Link>
        <Link href="/" className="compass-pill"><span>Home</span></Link>
      </div>

      <section className="max-w-4xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        <p className="compass-eyebrow mb-6">— Try it where you already work</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-8">
          Put Never86&apos;d <em>inside ChatGPT.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-3xl">
          The connector reads only the numbers or CSV you choose to send. It checks labor drift,
          reads invoice prices SKU by SKU, and turns a close into three next moves. It cannot log
          into your POS, contact a vendor, write up an employee, or move money.
        </p>

        <div className="compass-card border-[#b8d2ff] bg-[#f2f7ff] p-6 md:p-8 mt-10">
          <p className="compass-card-label" style={{ color: '#0066ff' }}>Works today · custom connector</p>
          <ol className="compass-body mt-4 space-y-3 text-base">
            <li><strong>1.</strong> Open ChatGPT Settings → Apps &amp; Connectors.</li>
            <li><strong>2.</strong> Add a custom remote MCP connector named <strong>Never86&apos;d Operator</strong>.</li>
            <li><strong>3.</strong> Paste the endpoint below and start with one of the prompts.</li>
          </ol>
          <div className="mt-6">
            <CopyMcpUrl url={MCP_PUBLIC_ENDPOINT} />
          </div>
          <a href="https://chatgpt.com" className="btn-primary mt-6 inline-flex" style={{ background: '#0066ff' }}>
            Open ChatGPT →
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mt-5">
          {STARTERS.map((prompt, index) => (
            <div key={prompt} className="compass-card p-5">
              <p className="compass-card-label">{['Payroll', 'Prices', 'Process'][index]}</p>
              <p className="compass-body mt-3 text-sm">{prompt}</p>
            </div>
          ))}
        </div>

        <div className="compass-card p-6 md:p-8 mt-5">
          <p className="compass-card-label">One-click directory install</p>
          <h2 className="mt-3 font-serif text-3xl text-[#1d1d1f]">Prepared, not published yet.</h2>
          <p className="compass-body mt-4 max-w-3xl">
            The live connector is ready. The final company step is domain verification and submission
            to OpenAI&apos;s plugin directory. Until OpenAI accepts it, operators use the custom connector above.
          </p>
          <p className="compass-body mt-4 text-sm">
            Provider installation: unverified. Marketplace publication: not submitted. Credentials: none claimed.
            READ-ONLY and DRAFT-ONLY: certified in repo.
          </p>
          <p className="compass-body mt-4 text-sm">
            <Link href="/store-listing" className="font-semibold text-[#0066ff] hover:underline">Publisher packet →</Link>
            {' · '}
            <Link href="/mcp" className="font-semibold text-[#0066ff] hover:underline">Technical details →</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
