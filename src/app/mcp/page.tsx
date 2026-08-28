import Link from 'next/link';
import type { Metadata } from 'next';
import { NEVER86_MCP_DISCOVERY, NEVER86_MCP_URL } from '@/lib/mcpDiscovery';

export const metadata: Metadata = {
  title: "Install in Grok + AI · Never 86'd",
  description: "Give Grok or another MCP client the same versioned Never 86'd operator system: Action Shift, 3P math, load-day, vendor silence, proof, memory, agents, and safety rules.",
  alternates: { canonical: 'https://www.never86.ai/mcp' },
  robots: { index: true, follow: true },
};

const CONNECTOR_NAME = "Never86'd Operator Intelligence";

export default function McpPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86'd <span className="italic text-ink-600">· for AI</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Restaurant margin intelligence · MCP endpoint</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/llm-shells" className="compass-pill"><span className="avatar">4</span><span>Four LLMs</span></Link>
            <Link href="/" className="compass-pill"><span className="avatar">H</span><span>Home</span></Link>
          </nav>
        </div>
      </div>
      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        <p className="compass-eyebrow mb-6">— Grok · ChatGPT · Claude · Gemini · MCP</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-8">Put the operator logic <em>next to you.</em></h1>
        <p className="compass-body text-lg md:text-xl mb-10 max-w-3xl">
          One public, read-only Model Context Protocol endpoint gives every supported AI the same versioned operator brain.
        </p>
        <div className="compass-card border-[#b8d2ff] bg-[#f2f7ff] p-6 md:p-8 mb-5">
          <p className="compass-card-label" style={{ color: '#0066ff' }}>One endpoint · four LLMs</p>
          <p className="compass-body mt-3 text-base max-w-3xl">
            The server is live. Discovery:{' '}
            <a href="/.well-known/mcp.json" className="font-semibold text-[#0066ff] hover:underline">/.well-known/mcp.json</a>
            {' '}· version {NEVER86_MCP_DISCOVERY.version}
          </p>
          <div className="mt-5 rounded-2xl border border-[#b8d2ff] bg-white p-4">
            <p className="compass-card-label">MCP endpoint (copy into every connector)</p>
            <p className="mt-3 break-all font-mono text-[15px] text-[#1d1d1f]">{NEVER86_MCP_URL}</p>
          </div>
        </div>
        <p className="compass-body mt-4">
          <Link href="/llm-shells" className="font-semibold text-[#0066ff] hover:underline">Open the four LLM try doors →</Link>
        </p>
        <p className="compass-body mt-8 text-sm">Thin ChatGPT, Claude, Gemini, and Grok install wrappers share this same MCP. Provider installation is unverified. Marketplace listings are not submitted. Credentials are not claimed. READ-ONLY and DRAFT-ONLY are certified in repo.</p>
      </section>
    </main>
  );
}
