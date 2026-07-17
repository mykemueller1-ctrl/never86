import Link from 'next/link';
import type { Metadata } from 'next';
import { TrackedLink } from '@/components/TrackedLink';

export const metadata: Metadata = {
  title: "Press kit · Never 86'd",
  description: "One-page press kit for Never 86'd. Built by an operator, for operators.",
  openGraph: {
    title: "Never 86'd · Press kit",
    description: "Built by an operator, for operators.",
    url: 'https://never86.ai/press',
  },
  alternates: { canonical: 'https://never86.ai/press' },
};

const RECEIPTS = [
  { v: '$1,043,797.69', l: 'The canary' },
  { v: '$15.72M',       l: 'The network' },
  { v: '$8.3M → $1.81M',l: 'The correction' },
];

const FACTS = [
  ['Company',          "Never 86'd · Inc."],
  ['Founder',          'Myke Mueller'],
  ['Site',             'https://never86.ai'],
  ['Press',            'press@never86.ai'],
  ['Sales / operator', 'myke@n86.app'],
  ['Headquarters',     'Fort Dodge, Iowa'],
];

export default function PressKit() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4 print:hidden">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· press kit</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Restaurant margin intelligence · press</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <TrackedLink href="/" event="press_nav_click" meta={{ target: '/', label: 'Home' }} className="compass-pill"><span className="avatar">H</span><span>Home</span></TrackedLink>
            <TrackedLink href="/onboard" event="press_nav_click" meta={{ target: '/onboard', label: 'Onboard your store' }} className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</TrackedLink>
          </nav>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-6 pt-16 pb-20 print:pt-6">
        <p className="compass-eyebrow mb-6">— Press kit</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-6">
          Never <em>86&apos;d.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-3xl leading-relaxed mb-16">
          Restaurant financial intelligence, built by an operator. For operators.
        </p>

        <section className="mb-16">
          <p className="compass-eyebrow mb-5">— Three receipts</p>
          <div className="grid md:grid-cols-3 gap-3">
            {RECEIPTS.map((r) => (
              <div key={r.l} className="compass-card">
                <p className="compass-card-label">{r.l}</p>
                <p className="font-mono tabular-nums text-2xl font-bold mt-3 text-white">{r.v}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <p className="compass-eyebrow mb-5">— Founder</p>
          <div className="compass-card">
            <p className="compass-card-label">Myke Mueller</p>
            <h3>Operator first, founder second.</h3>
            <p className="compass-body leading-relaxed mt-3">
              Runs Community Tap &amp; Pizza in Fort Dodge, Iowa. Available for: founder interviews, operator podcasts, restaurant-industry trade press.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <p className="compass-eyebrow mb-5">— Fast facts</p>
          <div className="compass-card overflow-hidden" style={{ padding: 0 }}>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-[#1f1f1f]">
                {FACTS.map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-5 py-3 text-[#6e6e73] text-[11px] uppercase tracking-wider font-mono w-1/3">{k}</td>
                    <td className="px-5 py-3 text-white">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </article>

      <footer className="border-t border-[#1f1f1f] py-10 px-6 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <TrackedLink href="mailto:press@never86.ai" event="press_email_click" meta={{ target: 'mailto:press@never86.ai', label: 'press@never86.ai' }} className="hover:text-white transition-colors">press@never86.ai</TrackedLink>
        </div>
      </footer>
    </main>
  );
}
