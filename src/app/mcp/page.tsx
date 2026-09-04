import Link from 'next/link';
import type { Metadata } from 'next';
import { MCP_PUBLIC_ENDPOINT, MCP_PUBLIC_TOOLS } from '@/lib/mcpPublicContract';

export const metadata: Metadata = {
  title: "Never86'd MCP · Payroll, Prices, Process",
  description:
    "The public read-only Never86'd MCP tools for labor drift, vendor price drift, and the daily Action Shift.",
  alternates: { canonical: 'https://www.never86.ai/mcp' },
  robots: { index: true, follow: true },
};

export default function McpPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">Never86&apos;d · MCP</p>
            <p className="compass-eyebrow-dim mt-2">Three jobs · read-only</p>
          </span>
        </Link>
        <Link href="/llm-shells" className="compass-pill"><span>Try in ChatGPT</span></Link>
      </div>

      <section className="max-w-4xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        <p className="compass-eyebrow mb-6">— Public operator tools</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-8">
          Payroll. Prices. <em>Process.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-3xl">
          One public MCP endpoint. It analyzes only data supplied in the current tool call, labels
          results Unverified, and returns evidence and next actions. No tenant data, POS credentials,
          external messages, refunds, or employee decisions.
        </p>

        <div className="compass-card border-[#b8d2ff] bg-[#f2f7ff] p-6 md:p-8 mt-10">
          <p className="compass-card-label" style={{ color: '#0066ff' }}>Remote MCP endpoint</p>
          <p className="mt-4 break-all font-mono text-[15px] text-[#1d1d1f]">{MCP_PUBLIC_ENDPOINT}</p>
          <p className="compass-body mt-4 text-sm">
            Discovery: <a href="/.well-known/mcp.json" className="font-semibold text-[#0066ff] hover:underline">/.well-known/mcp.json</a>
          </p>
        </div>

        <div className="grid gap-4 mt-5">
          {MCP_PUBLIC_TOOLS.map((tool, index) => (
            <div key={tool.name} className="compass-card p-6">
              <p className="compass-card-label">{String(index + 1).padStart(2, '0')} · {tool.name}</p>
              <p className="compass-body mt-3">{tool.description}</p>
            </div>
          ))}
        </div>

        <Link href="/llm-shells" className="btn-primary mt-8 inline-flex" style={{ background: '#0066ff' }}>
          Connect it to ChatGPT →
        </Link>
      </section>
    </main>
  );
}
