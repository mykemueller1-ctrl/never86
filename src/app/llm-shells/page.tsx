import Link from 'next/link';
import type { Metadata } from 'next';
import { MCP_PUBLIC_ENDPOINT } from '@/lib/mcpPublicContract';
import { CopyMcpUrl } from './CopyMcpUrl';

export const metadata: Metadata = {
  title: "Use Never86'd in ChatGPT, Claude & Perplexity",
  description:
    "Connect the public, read-only Never86'd MCP to supported AI clients for payroll, invoice-price, and restaurant-process analysis. Private owner data stays in the authenticated Never86'd Operator app.",
  alternates: { canonical: 'https://www.never86.ai/llm-shells' },
  robots: { index: true, follow: true },
};

const STARTERS = [
  'Analyze this labor CSV and show me the three biggest schedule-versus-actual review leads.',
  'Read this invoice CSV SKU by SKU and show me every price increase over 5%.',
  'Build today\'s Action Shift from my prior-day close. No more than three moves.',
];

const PROVIDERS = [
  {
    name: 'ChatGPT',
    status: 'Remote MCP · developer mode',
    steps: [
      'Enable developer mode if your ChatGPT plan/workspace requires it.',
      'Go to Settings / Workspace settings → Apps → Create.',
      'Enter the Never86’d public MCP endpoint, scan the tools, and create the draft app.',
    ],
    href: 'https://help.openai.com/en/articles/12584461',
    linkLabel: 'OpenAI setup guide',
  },
  {
    name: 'Claude',
    status: 'Remote MCP · custom connector',
    steps: [
      'Go to Customize → Connectors.',
      'Choose + → Add custom connector and enter the Never86’d MCP endpoint.',
      'Add the connector, then enable it from the Connectors menu in the conversation.',
    ],
    href: 'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
    linkLabel: 'Claude setup guide',
  },
  {
    name: 'Perplexity',
    status: 'Remote MCP · custom connector',
    steps: [
      'Go to Account settings → Connectors.',
      'Choose + Custom connector → Remote and enter the Never86’d MCP endpoint.',
      'Use HTTPS, select the supported remote transport, and use no app credentials for this public read-only connector.',
    ],
    href: 'https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors',
    linkLabel: 'Perplexity setup guide',
  },
] as const;

export default function LlmShellsPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">Never86&apos;d · AI connectors</p>
            <p className="compass-eyebrow-dim mt-2">Payroll · Prices · Process</p>
          </span>
        </Link>
        <Link href="/" className="compass-pill"><span>Home</span></Link>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        <p className="compass-eyebrow mb-6">— Use the operator logic where you already work</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-8">
          One public connector. <em>Multiple AI clients.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-3xl">
          The public Never86&apos;d connector reads only the numbers or CSV you deliberately send in the conversation.
          It can check labor drift, compare invoice prices SKU by SKU, and turn a close into a short review list.
          It cannot log into your POS, contact a vendor, write up an employee, change a schedule, or move money.
        </p>

        <div className="compass-card border-[#b8d2ff] bg-[#f2f7ff] p-6 md:p-8 mt-10">
          <p className="compass-card-label" style={{ color: '#0066ff' }}>Public MCP endpoint · read-only</p>
          <p className="compass-body mt-4 max-w-3xl">
            Use this endpoint for public operator methods and analysis you explicitly provide to the AI client. It is intentionally separate from the authenticated Never86&apos;d Operator app, which holds each restaurant&apos;s private evidence and requires its own authorization.
          </p>
          <div className="mt-6">
            <CopyMcpUrl url={MCP_PUBLIC_ENDPOINT} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 mt-5">
          {PROVIDERS.map((provider) => (
            <article key={provider.name} className="compass-card p-6">
              <p className="compass-card-label">{provider.status}</p>
              <h2 className="mt-3 font-serif text-3xl text-[#1d1d1f]">{provider.name}</h2>
              <ol className="compass-body mt-5 space-y-3 text-sm">
                {provider.steps.map((step, index) => (
                  <li key={step}><strong>{index + 1}.</strong> {step}</li>
                ))}
              </ol>
              <a href={provider.href} className="mt-6 inline-flex text-sm font-semibold text-[#0066ff] hover:underline" target="_blank" rel="noreferrer">
                {provider.linkLabel} →
              </a>
            </article>
          ))}
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
          <p className="compass-card-label">Private Never86&apos;d Operator app</p>
          <h2 className="mt-3 font-serif text-3xl text-[#1d1d1f]">Prepared for formal ChatGPT app review.</h2>
          <p className="compass-body mt-4 max-w-3xl">
            The private owner app is a different surface: authenticated, tenant-scoped, and designed for a restaurant&apos;s own evidence, owner interview, action queue, and explicit private writes. It is not exposed through the public endpoint above.
          </p>
          <p className="compass-body mt-4 text-sm">
            Public connector: available as a custom remote MCP where the provider supports it. ChatGPT directory/plugin publication for the private owner app: not claimed until review is completed.
          </p>
          <p className="compass-body mt-4 text-sm">
            <Link href="/store-listing" className="font-semibold text-[#0066ff] hover:underline">Publisher packet →</Link>
            {' · '}
            <Link href="/mcp" className="font-semibold text-[#0066ff] hover:underline">Technical details →</Link>
            {' · '}
            <Link href="/evidence-standard" className="font-semibold text-[#0066ff] hover:underline">Evidence standard →</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
