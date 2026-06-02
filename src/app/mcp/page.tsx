import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "For AI · Never 86'd",
  description: 'Public MCP endpoint for AI assistants.',
  alternates: { canonical: 'https://never86.ai/mcp' },
  robots: { index: true, follow: true },
};

export default function McpPage() {
  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
        </div>
      </header>

      <section className="pt-28 md:pt-40 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="display text-5xl md:text-7xl mb-8">For AI.</h1>
          <div className="card p-8 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 mb-2">MCP endpoint</p>
            <p className="font-mono text-ink-800 text-sm break-all">https://never86.ai/api/mcp</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-200 py-10 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-ink-500 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d</span>
          </div>
          <Link href="/" className="hover:text-ink-800 transition-colors">Home</Link>
        </div>
      </footer>
    </main>
  );
}
