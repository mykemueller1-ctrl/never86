import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Welcome · Never 86'd",
  description: 'Your agent is on the way.',
  alternates: { canonical: 'https://never86.ai/onboard' },
};

const STEPS = [
  { n: '01', title: 'We have your details', body: 'Check your inbox — Myke will personally reach out within 24 hours.' },
  { n: '02', title: 'Pick a 15-minute window', body: "We'll run your agent on a single store of yours, live. No setup. No CSV homework." },
  { n: '03', title: 'See your real numbers', body: "After the call: your gated Command Center, every figure source-tagged. Yours to keep." },
];

export default function OnboardPage() {
  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">Home</Link>
          </nav>
        </div>
      </header>

      <section className="pt-24 md:pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-success-500 mb-5">You&apos;re in</p>
          <h1 className="display text-5xl md:text-7xl mb-6">Welcome.</h1>
          <p className="text-ink-600 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Your agent is on the way. Here&apos;s what happens next.
          </p>
        </div>
      </section>

      <section className="py-12 px-6 bg-ink-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-7">
                <p className="display text-3xl text-ink-800 mb-3">{s.n}</p>
                <p className="text-ink-800 font-semibold text-lg tracking-tighter mb-2">{s.title}</p>
                <p className="text-ink-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="display text-3xl md:text-5xl mb-6">Want to skip the wait?</h2>
          <p className="text-ink-600 text-lg mb-8 leading-relaxed">Book the 15 minutes right now.</p>
          <a href="https://outlook.office.com/bookwithme/user/fe6663123f354f7da6e4bb9d76d223eb@n86.app?anonymous&ismsaljsauthenabled" target="_blank" rel="noopener" className="btn-primary">
            Book 15 minutes →
          </a>
        </div>
      </section>

      <footer className="border-t border-ink-200 py-10 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-ink-500 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d</span>
          </div>
          <Link href="/" className="hover:text-ink-800 transition-colors">Home</Link>
        </div>
      </footer>
    </main>
  );
}
