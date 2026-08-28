import Link from 'next/link';
import type { Metadata } from 'next';
import { getInstallMatrix } from '@/lib/llmShells';
import { CopyMcpUrl } from './CopyMcpUrl';

export const metadata: Metadata = {
  title: "Try Never 86'd in ChatGPT, Claude, Gemini, or Grok",
  description:
    "Search Never 86'd in ChatGPT or Claude and click Install once listed. Same operator brain. Not a marketplace listing yet.",
  alternates: { canonical: 'https://www.never86.ai/llm-shells' },
  robots: { index: true, follow: true },
};

const FIRST_PROMPT =
  "Use get_operator_system first. Then build one Action Shift from my last close. Stay READ-ONLY. Vendor copy is DRAFT-ONLY — I send it.";

const OPEN: Record<string, { href: string; label: string }> = {
  grok: { href: 'https://grok.com/connectors', label: 'Open Grok Connectors' },
  claude: { href: 'https://claude.ai/settings/connectors', label: 'Open Claude Connectors' },
  chatgpt: { href: 'https://chatgpt.com/plugins', label: 'Open ChatGPT Plugins' },
  gemini: { href: 'https://gemini.google.com', label: 'Open Gemini' },
};

export default function LlmShellsPage() {
  const matrix = getInstallMatrix();
  const mcpUrl = matrix.skillPack.mcpUrl;

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86{"'"}d <span className="italic text-ink-600">· try it in four LLMs</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Search · Install · same operator backend</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/mcp" className="compass-pill">
              <span className="avatar">M</span>
              <span>MCP</span>
            </Link>
            <Link href="/" className="compass-pill">
              <span className="avatar">H</span>
              <span>Home</span>
            </Link>
          </nav>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-12">
        <p className="compass-eyebrow mb-6">— ChatGPT · Claude · Gemini · Grok</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-8">
          Search Never86{"'"}d. <em>Click Install.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl mb-8 max-w-3xl">
          Operators do not paste URLs. They find us in the LLM they already use and click once.
          Restaurant math stays on Never86. Thin shells. Not four products. Not a Community Tap task.
        </p>
        <p className="compass-body text-base md:text-lg mb-8 max-w-3xl">
          ChatGPT Plugin Directory and Claude Connectors Directory are not submitted yet.
          Until they say Published, search will not find us. That filing is Never 86{"'"}d Inc., not a store manager.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {matrix.shells.map((shell) => {
            const open = OPEN[shell.provider];
            return (
              <div key={shell.provider} className="compass-card p-6">
                <p className="compass-card-label">{shell.label}</p>
                <h2 className="mt-2 font-serif text-2xl text-[#1d1d1f]">{shell.provider}</h2>
                <p className="compass-body mt-3 text-sm">{shell.installClient}</p>
                {open ? (
                  <a
                    href={open.href}
                    className="btn-primary mt-5 inline-flex"
                    style={{ background: '#0066ff' }}
                  >
                    {open.label} →
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>

        <details className="compass-card mt-5 p-6 md:p-8">
          <summary className="cursor-pointer font-serif text-2xl text-[#1d1d1f]">
            Status · not in the stores yet
          </summary>
          <ul className="compass-body mt-4 space-y-2 text-base">
            <li>Provider installation: unverified.</li>
            <li>Marketplace publication: not submitted.</li>
            <li>Credentials: none claimed.</li>
            <li>READ-ONLY and DRAFT-ONLY: certified in repo.</li>
            {matrix.honesty.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="compass-body mt-4 text-sm">
            Company publisher packet:{' '}
            <Link href="/store-listing" className="font-semibold text-[#0066ff] hover:underline">
              /store-listing
            </Link>
            {' · '}
            Machine matrix:{' '}
            <Link href="/api/llm-shells" className="font-semibold text-[#0066ff] hover:underline">
              /api/llm-shells
            </Link>
            {' · '}
            Human MCP guide:{' '}
            <Link href="/mcp" className="font-semibold text-[#0066ff] hover:underline">
              /mcp
            </Link>
          </p>
          <div className="mt-6">
            <p className="compass-card-label">Public MCP (publisher / engineers only)</p>
            <CopyMcpUrl url={mcpUrl} />
            <p className="mt-3 rounded-2xl bg-[#fbfbfd] p-4 font-mono text-sm leading-relaxed text-[#1d1d1f]">
              {FIRST_PROMPT}
            </p>
          </div>
        </details>
      </section>
    </main>
  );
}
