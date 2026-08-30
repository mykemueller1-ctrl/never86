import Link from 'next/link';
import type { Metadata } from 'next';
import { getStoreListingPacket } from '@/lib/llmShells/storeListing';

export const metadata: Metadata = {
  title: "Store listing packet · Never 86'd",
  description:
    'ChatGPT Plugin Directory and Claude Connectors Directory filing for Never 86\'d Inc. Not a restaurant task.',
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
                Never 86{"'"}d <span className="italic text-ink-600">· store listing</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Never 86{"'"}d Inc. publisher · not CTAP staff</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/llm-shells" className="compass-pill">
              <span className="avatar">T</span>
              <span>Try page</span>
            </Link>
          </nav>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <p className="compass-eyebrow mb-6">— 1-click Install</p>
        <h1 className="compass-display text-5xl md:text-6xl mb-8">
          Search Never86{"'"}d. <em>Click Install.</em>
        </h1>
        <p className="compass-body text-lg mb-8">
          This is a company publisher job. Community Tap managers do not file this.
          Operators never paste a URL. They search the directory and click Install after OpenAI or Anthropic list us.
        </p>

        <div className="compass-card border-[#b8d2ff] bg-[#f2f7ff] p-6 mb-5">
          <p className="compass-card-label" style={{ color: '#0066ff' }}>
            Status · not submitted
          </p>
          <ul className="compass-body mt-3 space-y-2 text-sm">
            {packet.honesty.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="compass-card p-6 mb-5">
          <p className="compass-card-label">1. ChatGPT · Never 86{"'"}d Inc. org</p>
          <p className="compass-body mt-3 text-sm">
            Log in as the company. Create plugin → With MCP. Auth: none. URL type: Universal.
          </p>
          <a
            href={L.chatgptPortal}
            className="btn-primary mt-5 inline-flex"
            style={{ background: '#0066ff' }}
          >
            Open ChatGPT plugin portal →
          </a>
        </div>

        <div className="compass-card p-6 mb-5">
          <p className="compass-card-label">Publisher form fields</p>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ['Name', L.name],
              ['MCP URL', L.mcpUrl],
              ['Website', L.website],
              ['Privacy', L.privacyUrl],
              ['Terms', L.termsUrl],
              ['Support', L.supportUrl],
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
          <p className="compass-card-label">5 positive tests</p>
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
          <p className="compass-card-label">3 negative tests</p>
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
          <p className="compass-card-label">2. Claude</p>
          <p className="compass-body mt-3 text-sm">{L.claudeRequires}</p>
          <a href={L.claudePortal} className="btn-primary mt-5 inline-flex" style={{ background: '#0066ff' }}>
            Open Claude directory form →
          </a>
        </div>

        <div className="compass-card p-6 mb-5">
          <p className="compass-card-label">3. Grok + Gemini</p>
          <p className="compass-body mt-3 text-sm">{L.grokNote}</p>
          <p className="compass-body mt-2 text-sm">{L.geminiNote}</p>
        </div>

        <p className="compass-body text-sm">
          Domain token from OpenAI goes at <code>{packet.domainChallengePath}</code>. Company publisher sends the token. Do not invent one.
        </p>
      </section>
    </main>
  );
}
