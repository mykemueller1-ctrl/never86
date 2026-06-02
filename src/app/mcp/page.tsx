import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Connect any AI · Never 86'd",
  description: 'Plug never86 into Gemini, ChatGPT, Claude, or Perplexity. Read-only answer corpus + free-agent catalog. No operator data.',
  openGraph: {
    title: "Never 86'd · for AI assistants",
    description: 'Public MCP server + REST endpoints for AI assistant integration.',
    url: 'https://never86.ai/mcp',
  },
  alternates: { canonical: 'https://never86.ai/mcp' },
};

const ENDPOINTS = [
  { label: 'MCP (JSON-RPC 2.0)', url: 'https://never86.ai/api/mcp', desc: 'For Claude Desktop, Gemini, ChatGPT MCP connectors.' },
  { label: 'REST · answers', url: 'https://never86.ai/api/answers', desc: 'Full Q&A corpus. Append ?slug=… for a single answer.' },
  { label: 'REST · quick wins + seats', url: 'https://never86.ai/api/quick-wins', desc: 'The 6 free agents + 7 role landings, with URLs.' },
  { label: 'llms.txt', url: 'https://never86.ai/llms.txt', desc: 'AI-crawler index of public answer URLs.' },
];

const TOOLS = [
  { name: 'list_answers', desc: 'Every published Q&A.' },
  { name: 'get_answer', desc: 'Fetch one by slug.' },
  { name: 'search_answers', desc: 'Full-text search the corpus.' },
  { name: 'list_free_agents', desc: 'The 6 quick-win demos with URLs.' },
  { name: 'list_seats', desc: 'The 7 role-routed landings.' },
];

export default function McpPage() {
  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">Home</Link>
            <Link href="/answers" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden md:inline">Answers</Link>
            <Link href="/operators#talk" className="btn-primary py-1.5 px-4 text-[13px]">Talk to us</Link>
          </nav>
        </div>
      </header>

      <section className="pt-24 md:pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="display text-5xl md:text-7xl mb-6">For AI assistants.</h1>
          <p className="text-ink-600 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Plug never86 into Gemini, ChatGPT, Claude, Perplexity, or anything else.
            We expose the answer corpus + the free-agent catalog. <span className="text-ink-800 font-semibold">Not the operator data. Not the methodology.</span>
          </p>
        </div>
      </section>

      <section className="py-16 px-6 bg-ink-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="display text-3xl md:text-4xl mb-8">Endpoints</h2>
          <div className="space-y-3">
            {ENDPOINTS.map((e) => (
              <div key={e.url} className="card p-6">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 mb-1">{e.label}</p>
                <p className="font-mono text-ink-800 text-sm mb-2">{e.url}</p>
                <p className="text-ink-600 text-sm leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="display text-3xl md:text-4xl mb-8">MCP tools</h2>
          <div className="card divide-y divide-ink-200">
            {TOOLS.map((t) => (
              <div key={t.name} className="p-5">
                <p className="font-mono text-ink-800 text-sm font-semibold">{t.name}</p>
                <p className="text-ink-600 text-sm mt-1">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-ink-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="display text-3xl md:text-4xl mb-8">Connect from Claude Desktop</h2>
          <div className="card p-6">
            <p className="text-ink-600 text-sm mb-3">Add to your <span className="font-mono">claude_desktop_config.json</span>:</p>
            <pre className="bg-ink-50 border border-ink-200 rounded-lg p-4 text-ink-800 text-[12px] font-mono overflow-x-auto">{`{
  "mcpServers": {
    "never86": {
      "url": "https://never86.ai/api/mcp"
    }
  }
}`}</pre>
          </div>
          <p className="text-ink-500 text-sm mt-6">Gemini / ChatGPT custom connectors: point at the same URL with JSON-RPC over HTTP.</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="display text-3xl md:text-4xl mb-6">What we DON&apos;T expose</h2>
          <div className="card p-7">
            <ul className="space-y-3 text-ink-700 leading-relaxed">
              <li className="flex items-start gap-3"><span className="text-danger-500 mt-1.5 text-xs">●</span><span>Operator-specific data. Never.</span></li>
              <li className="flex items-start gap-3"><span className="text-danger-500 mt-1.5 text-xs">●</span><span>The methodology — table names, queries, model logic, vendor wiring.</span></li>
              <li className="flex items-start gap-3"><span className="text-danger-500 mt-1.5 text-xs">●</span><span>Agent manifests (internal IP).</span></li>
              <li className="flex items-start gap-3"><span className="text-danger-500 mt-1.5 text-xs">●</span><span>Pipeline, leads, focus, team notes — anything in the admin command center.</span></li>
              <li className="flex items-start gap-3"><span className="text-success-500 mt-1.5 text-xs">●</span><span><span className="text-ink-800 font-semibold">What we do expose:</span> the published Q&amp;A corpus, the 6 free-agent URLs, the 7 role landings, and what we&apos;ll publicly attribute back to the source.</span></li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-200 py-10 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 text-ink-500 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/answers" className="hover:text-ink-800 transition-colors">Answers</Link>
            <Link href="/" className="hover:text-ink-800 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
