import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketplaceAuditFooter, MarketplaceAuditHeader } from '@/components/MarketplaceAuditShell';

export const metadata: Metadata = {
  title: "Privacy policy | Never86'd",
  description: "Privacy rules for Never86'd public restaurant operator tools and evidence-first workflows.",
  alternates: { canonical: 'https://www.never86.ai/privacy' },
};

const SECTIONS = [
  {
    title: 'Use the minimum data needed.',
    body: 'Never86’d is designed for restaurant operating evidence such as POS summaries, labor totals, invoices, vendor cadence, delivery marketplace statements, and typed operating facts. Do not submit credentials, MFA codes, full bank or routing numbers, tax IDs, guest identifiers, employee identifiers, personal addresses, or unrelated personal information.',
  },
  {
    title: 'Redact before sharing.',
    body: 'Remove guest and employee identifiers, account credentials, full financial-account identifiers, and unrelated personal data before uploading or pasting evidence. Keep the financial rows, dates, store scope, and stable pseudonymous references needed to reproduce a calculation.',
  },
  {
    title: 'Public MCP tools are read-only.',
    body: 'The public Never86’d MCP tools retrieve public guidance or perform deterministic calculations from supplied inputs. They are not designed to send messages, make payments, change payroll, issue refunds, discipline employees, grant access, or write private restaurant records.',
  },
  {
    title: 'Private store facts stay store-scoped.',
    body: 'Restaurant-specific targets, vendor names, cadence rules, recipes, category mappings, staff information, statements, invoices, and financial results are not part of the public Never86’d operator-system pack. Features that later store private restaurant memory must keep that data scoped to the applicable restaurant and account.',
  },
  {
    title: 'Service providers process requests.',
    body: 'Never86’d relies on hosting, security, analytics, and AI-platform services to operate the website and tools. Those services may process request content and technical metadata as needed to provide and protect the service. When you use Never86’d through ChatGPT or another AI platform, that platform’s own privacy and data-handling terms also apply to your interaction with that platform.',
  },
  {
    title: 'Evidence limits remain visible.',
    body: 'Never86’d separates supported facts from estimates, unknowns, and missing evidence. It does not use a restaurant variance by itself as proof of theft, fraud, misconduct, a contract violation, or guaranteed recoverable money.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="compass min-h-screen">
      <MarketplaceAuditHeader label="Privacy policy" />

      <section className="max-w-4xl mx-auto px-6 pt-16 md:pt-24 pb-12">
        <p className="compass-eyebrow mb-6">— Effective September 1, 2026</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-7">Protect the operator. Preserve the proof.</h1>
        <p className="compass-body text-xl md:text-2xl max-w-3xl leading-relaxed">
          Never86&apos;d is built to analyze restaurant operating evidence with the smallest practical data footprint. The public tools are designed for business facts, not credentials or unnecessary personal information.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          {SECTIONS.map((section, index) => (
            <article key={section.title} className="compass-card">
              <span className="font-mono text-[11px]" style={{ color: '#0066ff' }}>{String(index + 1).padStart(2, '0')}</span>
              <h2 className="!mt-3 text-xl">{section.title}</h2>
              <p className="compass-body text-base leading-relaxed mt-3">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8e8ed] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <p className="compass-eyebrow mb-4">— Evidence standard</p>
          <h2 className="compass-display text-3xl md:text-4xl">Show the source. State the limit.</h2>
          <p className="compass-body text-lg leading-relaxed mt-5 max-w-3xl">
            The separate Never86&apos;d evidence standard explains source labels, redaction expectations, claim boundaries, and the correction process.
          </p>
          <Link href="/evidence-standard" className="inline-block mt-6 text-sm underline" style={{ color: '#0066ff' }}>Read the evidence standard →</Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <p className="compass-eyebrow mb-4">— Questions or requests</p>
        <h2 className="compass-display text-3xl md:text-4xl">Contact Never86&apos;d.</h2>
        <p className="compass-body text-lg mt-4 max-w-2xl">
          For privacy questions, correction requests, or requests concerning information you supplied directly to Never86&apos;d, email <a className="underline" href="mailto:myke@n86.app">myke@n86.app</a>. Include only the information needed to identify the issue.
        </p>
      </section>

      <MarketplaceAuditFooter />
    </main>
  );
}
