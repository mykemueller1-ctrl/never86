import Link from 'next/link';
import type { Metadata } from 'next';
import { MCP_PUBLIC_ENDPOINT, MCP_PUBLIC_TOOLS } from '@/lib/mcpPublicContract';

export const metadata: Metadata = {
  title: "Never86'd MCP · Operator specialists + Payroll, Prices, Process",
  description:
    "Public read-only Never86'd MCP: operator system knowledge, one-agent-one-job specialists, labor, beverage, vendor prices, and Action Shift.",
  alternates: { canonical: 'https://www.never86.ai/mcp' },
  robots: { index: true, follow: true },
};

export default function McpPage() {
  const knowledge = MCP_PUBLIC_TOOLS.filter((tool) =>
    [
      'get_operator_system',
      'get_operator_logic',
      'get_3p_audit_logic',
      'list_answers',
      'list_free_agents',
      'list_agent_jobs',
      'list_specialists',
    ].includes(tool.name),
  );
  const analysis = MCP_PUBLIC_TOOLS.filter((tool) =>
    ['analyze_labor', 'analyze_beverage', 'analyze_vendor_prices', 'build_action_shift'].includes(tool.name),
  );

  return (
    <main className="compass min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">Never86&apos;d · MCP</p>
            <p className="compass-eyebrow-dim mt-2">Knowledge · specialists · read-only analysis</p>
          </span>
        </Link>
        <Link href="/llm-shells" className="compass-pill"><span>Try in ChatGPT</span></Link>
      </div>

      <section className="max-w-4xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        <p className="compass-eyebrow mb-6">— Public operator tools</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-8">
          One backend. <em>Specialists on top.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-3xl">
          Merchants connect once. Call <span className="font-semibold">get_operator_system</span>, then{' '}
          <span className="font-semibold">list_specialists</span> — one agent, one job. Analysis tools only use
          data supplied in the current call, label results Unverified, and never take portal passwords, send mail,
          or invent a close.
        </p>

        <div className="compass-card border-[#b8d2ff] bg-[#f2f7ff] p-6 md:p-8 mt-10">
          <p className="compass-card-label" style={{ color: '#0066ff' }}>Remote MCP endpoint</p>
          <p className="mt-4 break-all font-mono text-[15px] text-[#1d1d1f]">{MCP_PUBLIC_ENDPOINT}</p>
          <p className="compass-body mt-4 text-sm">
            Discovery: <a href="/.well-known/mcp.json" className="font-semibold text-[#0066ff] hover:underline">/.well-known/mcp.json</a>
          </p>
        </div>

        <h2 className="mt-14 font-serif text-3xl text-ink-800">Knowledge · call first</h2>
        <div className="grid gap-4 mt-5">
          {knowledge.map((tool, index) => (
            <div key={tool.name} className="compass-card p-6">
              <p className="compass-card-label">{String(index + 1).padStart(2, '0')} · {tool.name}</p>
              <p className="compass-body mt-3">{tool.description}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 font-serif text-3xl text-ink-800">Analysis · Payroll · Prices · Process · Beverage</h2>
        <div className="grid gap-4 mt-5">
          {analysis.map((tool, index) => (
            <div key={tool.name} className="compass-card p-6">
              <p className="compass-card-label">{String(index + 1).padStart(2, '0')} · {tool.name}</p>
              <p className="compass-body mt-3">{tool.description}</p>
            </div>
          ))}
        </div>

        <Link href="/llm-shells" className="btn-primary mt-8 inline-flex" style={{ background: '#0066ff' }}>
          Connect it for merchants →
        </Link>
      </section>
    </main>
  );
}
