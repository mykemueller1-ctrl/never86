import Link from 'next/link';
import type { Metadata } from 'next';

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
  { v: '$15.72M', l: 'The network' },
  { v: '$8.3M → $1.81M', l: 'The correction' },
];

const FACTS = [
  ['Company', "Never 86'd · Inc."],
  ['Founder', 'Myke Mueller'],
  ['Site', 'https://never86.ai'],
  ['Press', 'press@never86.ai'],
  ['Sales / operator', 'myke@n86.app'],
  ['Headquarters', 'Storm Lake, Iowa'],
];

export default function PressKit() {
  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40 print:hidden">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">Home</Link>
            <Link href="/reports/login" className="px-3 py-1.5 rounded-full text-ink-800 hover:bg-black/[0.04] font-medium">Sign in</Link>
          </nav>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-6 pt-16 pb-20 print:pt-6">
        <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-3">Press kit</p>
        <h1 className="display text-4xl md:text-6xl mb-4">Never 86&apos;d.</h1>
        <p className="text-ink-600 text-lg md:text-xl max-w-3xl leading-relaxed mb-16">
          Restaurant financial intelligence, built by an operator. For operators.
        </p>

        <section className="mb-16">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-5">Three receipts</p>
          <div className="grid md:grid-cols-3 gap-4">
            {RECEIPTS.map((r) => (
              <div key={r.l} className="card p-6">
                <p className="font-mono tabular-nums text-2xl font-bold mb-2 text-ink-800">{r.v}</p>
                <p className="text-ink-500 text-[11px] uppercase tracking-widest font-medium">{r.l}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-5">Founder</p>
          <div className="card p-7">
            <p className="text-ink-800 font-semibold text-xl tracking-tighter mb-3">Myke Mueller</p>
            <p className="text-ink-600 leading-relaxed">
              Operator first, founder second. Runs Community Tap &amp; Pizza in Storm Lake, Iowa.
              Available for: founder interviews, operator podcasts, restaurant-industry trade press.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-5">Fast facts</p>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-ink-200">
                {FACTS.map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-5 py-3 text-ink-500 text-[11px] uppercase tracking-wider font-mono w-1/3">{k}</td>
                    <td className="px-5 py-3 text-ink-800">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </article>

      <footer className="border-t border-ink-200 py-10 px-6 bg-white print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-ink-500 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d</span>
          </div>
          <a href="mailto:press@never86.ai" className="hover:text-ink-800 transition-colors">press@never86.ai</a>
        </div>
      </footer>
    </main>
  );
}
