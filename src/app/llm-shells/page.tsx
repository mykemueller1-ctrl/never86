import Link from 'next/link';
import type { Metadata } from 'next';
import { getInstallMatrix } from '@/lib/llmShells';

export const metadata: Metadata = {
  title: "LLM shells · Never 86'd",
  description: "Thin ChatGPT, Claude, Gemini, and Grok install shells for the same Never 86'd MCP backend. One skill pack. No forked restaurant math. Not a marketplace listing.",
  alternates: { canonical: 'https://www.never86.ai/llm-shells' },
  robots: { index: true, follow: true },
};

export default function LlmShellsPage() {
  const matrix = getInstallMatrix();
  const cert = matrix.certification;

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86&apos;d <span className="italic text-ink-600">· four LLM shells</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Thin install wrappers · one operator backend</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/mcp" className="compass-pill"><span className="avatar">M</span><span>MCP</span></Link>
            <Link href="/" className="compass-pill"><span className="avatar">H</span><span>Home</span></Link>
          </nav>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-12">
        <p className="compass-eyebrow mb-6">— ChatGPT · Claude · Gemini · Grok</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-8">
          Same brain. <em>Thin shells.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl mb-8 max-w-3xl">
          One versioned skill pack ({matrix.skillPack.id} v{matrix.skillPack.version}) tells every supported AI to call the public Never86 MCP. Restaurant formulas, tenant isolation, proof gates, and audit stay on the backend. These files are install instructions, not a second product.
        </p>

        <div className="compass-card border-[#b8d2ff] bg-[#f2f7ff] p-6 md:p-8 mb-5">
          <p className="compass-card-label" style={{ color: '#0066ff' }}>Honest status</p>
          <ul className="compass-body mt-4 space-y-2 text-base">
            <li>Repo state: drafted in git. Not merged, not production-deployed from this branch.</li>
            <li>Marketplace publication: not submitted — no GPT Store, Claude directory, Gemini gallery, or Grok featured-connector claim.</li>
            <li>Live provider install: unverified. A human still has to add the connector in each app.</li>
            <li>Credentials: none claimed. Public MCP is unauthenticated and read-only.</li>
            <li>Restaurant-tenant OAuth for these four shells: not claimed.</li>
          </ul>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-5">
          <div className="compass-card p-6">
            <p className="compass-card-label">READ-ONLY certified in repo</p>
            <p className="compass-body mt-3 text-sm">{cert.gates['READ-ONLY'].summary}</p>
            <p className="compass-body mt-3 text-xs">Live-verified on a provider UI: no.</p>
          </div>
          <div className="compass-card p-6">
            <p className="compass-card-label">DRAFT-ONLY certified in repo</p>
            <p className="compass-body mt-3 text-sm">{cert.gates['DRAFT-ONLY'].summary}</p>
            <p className="compass-body mt-3 text-xs">Live external writes: none.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {matrix.shells.map((shell) => (
            <div key={shell.provider} className="compass-card p-6">
              <p className="compass-card-label">{shell.label}</p>
              <h2 className="mt-2 font-serif text-2xl text-[#1d1d1f]">{shell.provider}</h2>
              <p className="compass-body mt-3 text-sm">{shell.installClient}</p>
              <ol className="compass-body mt-4 space-y-2 text-sm">
                {shell.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-4 font-mono text-xs break-all">
                Manifest: /api/llm-shells/{shell.provider}
              </p>
            </div>
          ))}
        </div>

        <div className="compass-card mt-5 p-6 md:p-8">
          <p className="compass-card-label">Machine-readable</p>
          <p className="compass-body mt-3">Install matrix: <Link href="/api/llm-shells" className="font-semibold text-[#0066ff] hover:underline">/api/llm-shells</Link></p>
          <p className="compass-body mt-2">MCP discovery: <Link href="/api/mcp" className="font-semibold text-[#0066ff] hover:underline">/api/mcp</Link></p>
          <p className="compass-body mt-2">Human MCP guide: <Link href="/mcp" className="font-semibold text-[#0066ff] hover:underline">/mcp</Link></p>
        </div>
      </section>
    </main>
  );
}
