import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketplaceAuditFooter, MarketplaceAuditHeader } from '@/components/MarketplaceAuditShell';

export const metadata: Metadata = {
  title: "Support | Never86'd",
  description: "Support for Never86'd restaurant operator tools, source corrections, and ChatGPT plugin workflows.",
  alternates: { canonical: 'https://www.never86.ai/support' },
};

const HELP = [
  {
    title: 'Operator result or calculation',
    body: 'Include the Never86’d page or workflow, restaurant reporting period, the specific number or conclusion in question, and the redacted source evidence needed to reproduce it.',
  },
  {
    title: 'Source or public-page correction',
    body: 'Send the public URL and the authoritative source that supports the correction. Material public corrections are handled under the Never86’d evidence and corrections standard.',
  },
  {
    title: 'ChatGPT plugin or MCP issue',
    body: 'Include the prompt you used, the Never86’d tool or workflow if known, the approximate time, and the user-visible error. Do not send access tokens, passwords, MFA codes, or unrelated private restaurant data.',
  },
];

export default function SupportPage() {
  return (
    <main className="compass min-h-screen">
      <MarketplaceAuditHeader label="Support" />

      <section className="max-w-4xl mx-auto px-6 pt-16 md:pt-24 pb-12">
        <p className="compass-eyebrow mb-6">— Never86&apos;d support</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-7">Bring the source and the question.</h1>
        <p className="compass-body text-xl md:text-2xl max-w-3xl leading-relaxed">
          For product support, a calculation question, a source correction, or a ChatGPT plugin issue, email <a className="underline" href="mailto:myke@n86.app">myke@n86.app</a>.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {HELP.map((item, index) => (
            <article key={item.title} className="compass-card">
              <span className="font-mono text-[11px]" style={{ color: '#0066ff' }}>{String(index + 1).padStart(2, '0')}</span>
              <h2 className="!mt-3 text-xl">{item.title}</h2>
              <p className="compass-body text-base leading-relaxed mt-3">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8e8ed] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <p className="compass-eyebrow mb-4">— Before sending evidence</p>
          <h2 className="compass-display text-3xl md:text-4xl">Redact what the math does not need.</h2>
          <p className="compass-body text-lg leading-relaxed mt-5 max-w-3xl">
            Remove credentials, MFA codes, full bank or routing numbers, tax IDs, guest identifiers, employee identifiers, personal addresses, and unrelated personal information. Preserve dates, store scope, financial rows, and stable references needed to reproduce the result.
          </p>
          <div className="flex flex-wrap gap-5 mt-6 text-sm">
            <Link className="underline" href="/privacy">Privacy policy →</Link>
            <Link className="underline" href="/evidence-standard">Evidence standard →</Link>
            <Link className="underline" href="/terms">Terms →</Link>
          </div>
        </div>
      </section>

      <MarketplaceAuditFooter />
    </main>
  );
}
