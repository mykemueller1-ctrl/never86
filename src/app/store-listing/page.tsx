import Link from 'next/link';
import type { Metadata } from 'next';
import { getStoreListingPacket } from '@/lib/llmShells/storeListing';

export const metadata: Metadata = {
  title: "AI connector publisher packet · Never86'd",
  description:
    "Internal publisher packet for the public Never86'd MCP and provider-specific connector review. Not a restaurant task.",
  alternates: { canonical: 'https://www.never86.ai/store-listing' },
  robots: { index: false, follow: false },
};

export default function StoreListingPage() {
  const packet = getStoreListingPacket();
  const L = packet.listing;

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86{"'"}d <span className="italic text-ink-600">· publisher packet</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Never 86{"'"}d Inc. · provider review only</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/llm-shells" className="compass-pill">
              <span className="avatar">AI</span>
              <span>Connector page</span>
            </Link>
          </nav>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <p className="compass-eyebrow mb-6">— Provider release packet</p>
        <h1 className="compass-display text-5xl md:text-6xl mb-8">
          Verify first. <em>Publish second.</em>
        </h1>
        <p className="compass-body text-lg mb-8">
          The public read-only MCP can be added as a custom remote connector on supported providers today.
          Directory or plugin publication is a separate provider-review step and is never marked complete until the provider approves it.
        </p>

        <div className="compass-card border-[#b8d2ff] bg-[#f2f7ff] p-6 mb-5">
          <p className="compass-card-label" style={{ color: '#0066ff' }}>
            Honest launch status
          </p>
          <ul className="compass-body mt-3 space-y-2 text-sm">
            {packet.honesty.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="compass-card p-6 mb-5">
          <p className="compass-card-label">1. ChatGPT · custom MCP verification</p>
          <p className="compass-body mt-3 text-sm">
            Use ChatGPT developer mode to create a custom app from the MCP endpoint, scan the tools, and test the reviewer cases. A public Plugins Directory listing is a separate submission/review step.
          </p>
          <a
            href="https://help.openai.com/en/articles/12584461"
            className="btn-primary mt-5 inline-flex"
            style={{ background: '#0066ff' }}
            target="_blank"
            rel="noreferrer"
          >
            Open current ChatGPT MCP guide →
          </a>
        </div>

        <div className="compass-card p-6 mb-5">
          <p className="compass-card-label">Publisher / connector fields</p>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ['Name', L.name],
              ['MCP URL', L.mcpUrl],
              ['Website', L.website],
              ['Support', L.supportUrl],
              ['Privacy', L.privacyUrl],
              ['Terms', L.termsUrl],
              ['Short', L.shortDescription],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] uppercase tracking-wider text-[#6e6e73] font-mono">{k}</dt>
                <dd className="mt-1 rounded-xl bg-[#fbfbfd] p-3 font-mono text-[13px] leading-relaxed text-[#1d1d1f]">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="compass-card p-6 mb-5">
          <p className="compass-card-label">Starter prompt</p>
          <p className="mt-3 rounded-xl bg-[#fbfbfd] p-4 font-mono text-sm leading-relaxed text-[#1d1d1f]">
            {packet.starterPrompts[0]}
          </p>
        </div>

        <div className="compass-card p-6 mb-5">
          <p className="compass-card-label">Public MCP · 5 positive checks</p>
          <ol className="mt-4 space-y-3 text-sm compass-body">
            {packet.positiveTests.map((row) => (
              <li key={row.id}>
                <strong className="text-[#1d1d1f]">{row.id}.</strong> {row.prompt}
                <div className="text-[#6e6e73] mt-1">Expect: {row.expected}</div>
              </li>
            ))}
          </ol>
        </div>

        <div className="compass-card p-6 mb-5">
          <p className="compass-card-label">Public MCP · 3 negative checks</p>
          <ol className="mt-4 space-y-3 text-sm compass-body">
            {packet.negativeTests.map((row) => (
              <li key={row.id}>
                <strong className="text-[#1d1d1f]">{row.id}.</strong> {row.prompt}
                <div className="text-[#6e6e73] mt-1">Expect: {row.expected} ({row.reason})</div>
              </li>
            ))}
          </ol>
        </div>

        <div className="compass-card p-6 mb-5">
          <p className="compass-card-label">2. Claude · custom remote MCP</p>
          <p className="compass-body mt-3 text-sm">{L.claudeRequires}</p>
          <a
            href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp"
            className="btn-primary mt-5 inline-flex"
            style={{ background: '#0066ff' }}
            target="_blank"
            rel="noreferrer"
          >
            Open current Claude connector guide →
          </a>
        </div>

        <div className="compass-card p-6 mb-5">
          <p className="compass-card-label">3. Perplexity · custom remote MCP</p>
          <p className="compass-body mt-3 text-sm">{L.perplexityRequires}</p>
          <a
            href="https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors"
            className="btn-primary mt-5 inline-flex"
            style={{ background: '#0066ff' }}
            target="_blank"
            rel="noreferrer"
          >
            Open current Perplexity connector guide →
          </a>
        </div>

        <div className="compass-card p-6 mb-5">
          <p className="compass-card-label">Other model clients</p>
          <p className="compass-body mt-3 text-sm">{L.grokNote}</p>
          <p className="compass-body mt-2 text-sm">{L.geminiNote}</p>
        </div>

        <p className="compass-body text-sm">
          Never publish a directory/install claim from this packet until the live provider flow is verified. If OpenAI issues a domain challenge token, place only the issued value at <code>{packet.domainChallengePath}</code>.
        </p>
      </section>
    </main>
  );
}
