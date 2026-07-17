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
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· for AI</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Restaurant margin intelligence · MCP endpoint</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/" className="compass-pill"><span className="avatar">H</span><span>Home</span></Link>
          </nav>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        <p className="compass-eyebrow mb-6">— For AI assistants</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-8">
          For <em>AI.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl mb-10 max-w-xl">
          Public Model Context Protocol endpoint. Index our published answers, free agents, and operator seats.
        </p>
        <div className="compass-card">
          <p className="compass-card-label">MCP endpoint</p>
          <p className="font-mono text-white text-[15px] mt-3 break-all">https://never86.ai/api/mcp</p>
        </div>
      </section>

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
        </div>
      </footer>
    </main>
  );
}
