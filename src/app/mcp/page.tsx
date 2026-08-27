import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Install in Grok + AI · Never 86'd",
  description: "Give Grok or another MCP client the same versioned Never 86'd operator system: Action Shift, 3P math, load-day, vendor silence, proof, memory, agents, and safety rules.",
  alternates: { canonical: 'https://www.never86.ai/mcp' },
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
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86&apos;d <span className="italic text-ink-600">· for AI</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Restaurant margin intelligence · MCP endpoint</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/" className="compass-pill"><span className="avatar">H</span><span>Home</span></Link>
          </nav>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        <p className="compass-eyebrow mb-6">— Grok · ChatGPT · Claude · Gemini · MCP</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-8">
          Put the operator logic <em>next to you.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl mb-10 max-w-3xl">
          One public, read-only Model Context Protocol endpoint gives every supported AI the same versioned operator brain: Action Shift, deterministic 3P math, load-day onboarding, vendor silence, proof and memory rules, specialist-agent routines, POS and invoice routing, and the public answer desk.
        </p>

        <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <div className="compass-card border-[#b8d2ff] bg-[#f2f7ff] p-6 md:p-8">
            <p className="compass-card-label" style={{ color: '#0066ff' }}>Install in Grok</p>
            <ol className="compass-body mt-5 space-y-4 text-base">
              <li><strong className="text-[#1d1d1f]">1.</strong> Open <a href="https://grok.com/connectors" className="font-semibold text-[#0066ff] hover:underline">Grok Connectors</a> and choose <strong>New Connector → Custom</strong>.</li>
              <li><strong className="text-[#1d1d1f]">2.</strong> Name it <strong>Never86&apos;d Operator Intelligence</strong>.</li>
              <li><strong className="text-[#1d1d1f]">3.</strong> Paste the endpoint below and add it. No restaurant login or marketplace password is required.</li>
            </ol>
            <div className="mt-6 rounded-2xl border border-[#b8d2ff] bg-white p-4">
              <p className="compass-card-label">MCP endpoint</p>
              <p className="mt-3 break-all font-mono text-[15px] text-[#1d1d1f]">https://www.never86.ai/api/mcp</p>
            </div>
            <a href="https://docs.x.ai/grok/connectors" className="mt-5 inline-flex text-sm font-semibold text-[#0066ff] hover:underline">Grok connector instructions ↗</a>
          </div>

          <div className="compass-card p-6 md:p-8">
            <p className="compass-card-label">Load the whole system first</p>
            <p className="compass-body mt-4 text-base">Ask Grok:</p>
            <p className="mt-3 rounded-2xl bg-[#fbfbfd] p-4 font-mono text-sm leading-relaxed text-[#1d1d1f]">Use Never86&apos;d get_operator_system first. Then build my Action Shift for the prior complete business day. Give me one next action, its owner, the proof required tonight, and the exact missing evidence. Use only my store&apos;s approved targets and rules.</p>
            <p className="compass-body mt-5 text-sm">Typed totals stay unverified until matched to a finalized source. A variance ranks review work—it is not proof of theft, loss, or guaranteed savings.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Action Shift', 'One store · up to three morning actions · one night proof loop, using only operator-supplied targets.'],
            ['Load-day + memory', 'Conversational onboarding, four-week source map, versioned tribal rules, and operator controls to show, correct, delete, or export them.'],
            ['Vendor silence', 'Operator-approved cadence, closure pauses, 14-day advisory period, duplicate suppression, and proof-based reset.'],
            ['3P Quick Win', 'Commission, fees, promos, refunds, expected payout, and variance—deterministic to the cent.'],
            ['POS routing', 'Toast, PDQ, Square, Aloha, Simphony, PAR/Brink, Lightspeed, and safe marketplace attribution.'],
            ['Invoices + product mix', 'Daily Prime reconciliation, vendor drift, product-mix pars, catering invoice-to-POS gaps, and evidence status.'],
            ['Inside-the-four-walls', 'Voids, refunds, ticket signals, labor drift, tips, and beverage shrink with calibrated thresholds.'],
            ['Agent team + routines', 'Source Collector, Margin Analyst, Operator Coach, Proof Verifier, Memory Curator, and Store Chief of Staff on one shared backend.'],
            ['Truth + safety gates', 'Untrusted-file defenses, human approval before external side effects, tenant isolation, and explicit Missing Evidence.'],
            ['Public answer desk', 'Restaurant evidence guides, agent specs, source tags, and exact next records needed.'],
            ['Read-only by design', 'No operator database, credentials, marketplace login, or private admin tables are exposed.'],
          ].map(([title, body]) => (
            <div key={title} className="compass-card p-5">
              <h2 className="font-serif text-2xl text-[#1d1d1f]">{title}</h2>
              <p className="compass-body mt-3 text-sm">{body}</p>
            </div>
          ))}
        </div>

        <div className="compass-card mt-5 p-6 md:p-8">
          <p className="compass-card-label">One brain · many interfaces</p>
          <h2 className="mt-3 font-serif text-3xl text-[#1d1d1f]">Do not rebuild the logic inside each chatbot.</h2>
          <p className="compass-body mt-4 max-w-3xl">Grok, ChatGPT, Claude, Gemini, and any other client with compatible remote MCP support should call this same endpoint. Their wording can differ. The formulas, evidence states, store-memory contract, action limits, and human-approval gates stay the same.</p>
          <p className="compass-body mt-4 max-w-3xl">Thin install shells and the honest status matrix live at <Link href="/llm-shells" className="font-semibold text-[#0066ff] hover:underline">/llm-shells</Link>. Those files are drafted in git. They are not GPT Store, Claude directory, Gemini gallery, or Grok featured-connector listings. Live install inside each provider UI stays unverified until a human adds the connector.</p>
        </div>

        <div className="compass-card mt-5 p-6 md:p-8">
          <p className="compass-card-label">Use it around X</p>
          <h2 className="mt-3 font-serif text-3xl text-[#1d1d1f]">Public lesson. Private math.</h2>
          <p className="compass-body mt-4 max-w-3xl">On X, share the no-login Quick Win or ask Grok to explain the method. Never post a marketplace statement, invoice, payroll export, POS file, bank record, or guest data publicly. Run the dollar work privately in Grok or in the browser calculator.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/audit" className="btn-primary" style={{ background: '#0066ff' }}>Open the free Quick Win →</Link>
            <Link href="/delivery-marketplace-reconciliation" className="btn-secondary">Open the evidence desk →</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e8e8ed] py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <Link href="/" className="hover:text-ink-800 transition-colors">Home</Link>
        </div>
      </footer>
    </main>
  );
}
