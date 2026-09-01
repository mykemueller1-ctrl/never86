import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketplaceAuditFooter, MarketplaceAuditHeader } from '@/components/MarketplaceAuditShell';

export const metadata: Metadata = {
  title: "Terms of use | Never86'd",
  description: "Terms for Never86'd public restaurant operator intelligence and free operator workflows.",
  alternates: { canonical: 'https://www.never86.ai/terms' },
};

const TERMS = [
  {
    title: 'Operational guidance, not professional advice.',
    body: 'Never86’d provides restaurant operating analysis, calculations, workflow guidance, and educational information. It is not legal, tax, accounting, investment, employment-law, or other licensed professional advice. Use qualified professionals for decisions in those scopes.',
  },
  {
    title: 'Your evidence controls the conclusion.',
    body: 'You are responsible for the accuracy, completeness, and lawful use of the information you provide. Never86’d may label a result Verified, Reconciled, Partial, Estimated, Unverified, or Missing Evidence according to the available source record. Missing evidence is a valid result.',
  },
  {
    title: 'No automatic accusation.',
    body: 'A variance, refund, fee, payout difference, clock issue, void, discount, silence signal, or other exception is not by itself proof of theft, fraud, misconduct, a contract violation, a bank error, or recoverable money. Those conclusions require the evidence appropriate to the claim.',
  },
  {
    title: 'No guaranteed savings or outcomes.',
    body: 'Observed target gaps, exposed dollars, modeled opportunities, and reconciliation differences are not guaranteed savings, recoveries, or future financial results. Restaurant outcomes depend on execution, source quality, local conditions, and management decisions.',
  },
  {
    title: 'Human approval stays in the loop.',
    body: 'Public Never86’d tools are read-only. Never86’d may draft or recommend actions, but operators remain responsible for approving external messages, vendor requests, payroll or staffing changes, refunds, payments, disciplinary decisions, access changes, and other consequential actions.',
  },
  {
    title: 'Independent product.',
    body: 'Never86’d is independent and is not affiliated with or endorsed by DoorDash, Uber Eats, Grubhub, ezCater, Toast, or other third-party platforms discussed or analyzed unless a separate written agreement explicitly states otherwise.',
  },
  {
    title: 'Free operator scope.',
    body: 'The intended launch model provides one location and one primary operator workflow free. Additional locations, seats, persistence, integrations, automation, role-based controls, or enterprise services may be offered separately and may require paid terms.',
  },
  {
    title: 'Use the service lawfully and safely.',
    body: 'Do not submit credentials, malware, unlawful content, or data you are not authorized to use. Do not use Never86’d to fabricate evidence, evade controls, impersonate people, or make unsupported accusations about employees, vendors, guests, or third parties.',
  },
];

export default function TermsPage() {
  return (
    <main className="compass min-h-screen">
      <MarketplaceAuditHeader label="Terms of use" />

      <section className="max-w-4xl mx-auto px-6 pt-16 md:pt-24 pb-12">
        <p className="compass-eyebrow mb-6">— Effective September 1, 2026</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-7">Use the tool. Keep the judgment.</h1>
        <p className="compass-body text-xl md:text-2xl max-w-3xl leading-relaxed">
          These terms govern use of the public Never86&apos;d website, operator tools, MCP tools, and free operator workflows. By using them, you agree to use the outputs as evidence-based operating support rather than as a substitute for human judgment or required professional advice.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          {TERMS.map((term, index) => (
            <article key={term.title} className="compass-card">
              <span className="font-mono text-[11px]" style={{ color: '#0066ff' }}>{String(index + 1).padStart(2, '0')}</span>
              <h2 className="!mt-3 text-xl">{term.title}</h2>
              <p className="compass-body text-base leading-relaxed mt-3">{term.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8e8ed] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <p className="compass-eyebrow mb-4">— Source and privacy rules</p>
          <p className="compass-body text-lg leading-relaxed max-w-3xl">
            The <Link className="underline" href="/evidence-standard">evidence standard</Link> and <Link className="underline" href="/privacy">privacy policy</Link> form part of the operating boundary for public Never86&apos;d workflows.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <p className="compass-eyebrow mb-4">— Contact</p>
        <h2 className="compass-display text-3xl md:text-4xl">Questions about these terms.</h2>
        <p className="compass-body text-lg mt-4 max-w-2xl">
          Email <a className="underline" href="mailto:myke@n86.app">myke@n86.app</a> with the page or workflow involved and the specific question.
        </p>
      </section>

      <MarketplaceAuditFooter />
    </main>
  );
}
