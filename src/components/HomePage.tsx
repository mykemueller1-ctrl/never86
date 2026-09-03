'use client';

import Link from 'next/link';
import { HumanSiteFooter, HumanSiteHeader } from '@/components/HumanSiteShell';
import { trackEvent } from '@/lib/track';

const PILLARS = [
  {
    label: 'Payroll',
    title: 'Labor before it becomes payroll.',
    copy: 'Line up schedules, punches, sales, and overtime. See where labor outran demand while there is still time to coach the shift.',
    ask: 'Where did labor drift yesterday?',
  },
  {
    label: 'Prices',
    title: 'Every SKU. Every invoice.',
    copy: 'Nobody has time to read every invoice line. Never 86’d compares them, catches silent price creep, and keeps the source beside the answer.',
    ask: 'Which vendor price moved—and by how much?',
  },
  {
    label: 'Process',
    title: 'Less chaos. One next move.',
    copy: 'Bring the close, the schedule, a photo, or the problem driving you nuts. Get the smallest action to run today and the proof to check tonight.',
    ask: 'What should my manager fix first?',
  },
] as const;

export default function Home() {
  return (
    <main className="human-page min-h-screen">
      <HumanSiteHeader />

      <section className="relative overflow-hidden px-5 pb-20 pt-14 md:px-8 md:pb-28 md:pt-24">
        <div className="human-grid-lines" aria-hidden />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <p className="human-kicker">Payroll · Prices · Process</p>
            <h1 className="mt-6 max-w-5xl font-serif text-[clamp(3.9rem,8.5vw,7.8rem)] font-medium leading-[0.88] tracking-[-0.055em] text-[#161616]">
              Find the leak.
              <span className="block italic text-[#005de8]">Run the fix.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#514b43] md:text-xl">
              Your restaurant already creates the answer. It is buried in labor, invoices, and the daily mess. Never 86&apos;d reads the evidence, explains what changed, and gives you one move with the receipt attached.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/onboard" className="human-button human-button-primary" onClick={() => trackEvent('home_hero_cta_click', { meta: { target: '/onboard', label: 'Open with email' } })}>
                Open with your email →
              </Link>
              <Link href="/llm-shells" className="human-button human-button-secondary" onClick={() => trackEvent('home_hero_cta_click', { meta: { target: '/llm-shells', label: 'Try in ChatGPT' } })}>
                Try it in ChatGPT
              </Link>
            </div>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6f675e]">
              No card · no password · no sales call · one operator seat free
            </p>
          </div>

          <div className="human-receipt-card border-[#005de8] bg-[#fffdf8] p-7 md:p-9">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#005de8]">Example operator answer</p>
              <span className="rounded-full bg-[#eaf2ff] px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#005de8]">Prices</span>
            </div>
            <h2 className="mt-8 font-serif text-4xl leading-tight text-[#1b1b1b]">Olive oil moved 15.8%.</h2>
            <p className="mt-4 text-base leading-relaxed text-[#514b43]">
              The current case is $79.20, up from $68.40. That is $10.80 of price drift on the same SKU—not usage, waste, or a guess.
            </p>
            <div className="mt-7 border-l-4 border-[#005de8] bg-[#f1f6ff] p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[#005de8]">Next move</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#252525]">Verify pack size, then ask the vendor to explain the increase before the next order.</p>
            </div>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#766f65]">Receipt · two invoice periods · same vendor · same SKU</p>
          </div>
        </div>
      </section>

      <section id="what-it-finds" className="border-t border-[#d8cec0] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="human-kicker">The three places profit disappears</p>
          <h2 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-[#171717] md:text-7xl">
            Three Ps.
            <span className="block italic text-[#005de8]">One operator.</span>
          </h2>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {PILLARS.map((pillar, index) => (
              <article key={pillar.label} className="human-receipt-card">
                <p className="font-mono text-xs font-bold text-[#005de8]">0{index + 1} · {pillar.label}</p>
                <h3 className="mt-8 font-serif text-3xl leading-tight text-[#1b1b1b]">{pillar.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#5b554d]">{pillar.copy}</p>
                <p className="mt-8 border-t border-[#d8cec0] pt-4 text-sm font-semibold text-[#005de8]">“{pillar.ask}”</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="human-dark-section px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#81aefc]">How operators start</p>
          <h2 className="mt-6 max-w-4xl font-serif text-5xl leading-[0.96] tracking-[-0.04em] text-white md:text-7xl">
            Email. Evidence.
            <span className="block italic text-[#8db6ff]">Next move.</span>
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              ['1', 'Open with email', 'Click the secure link. No password, card, or onboarding interview.'],
              ['2', 'Bring one real thing', 'An invoice, labor report, schedule, close, photo, or plain-English question.'],
              ['3', 'Get a receipt-backed move', 'See what changed, why it matters, what to do next, and what proves the fix.'],
            ].map(([number, title, copy]) => (
              <article key={number} className="rounded-2xl border border-[#33455c] bg-[#111b27] p-6">
                <p className="font-mono text-xs font-bold text-[#81aefc]">{number}</p>
                <h3 className="mt-6 font-serif text-3xl text-white">{title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#c6d1df]">{copy}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/onboard" className="human-button human-button-light">Open Never 86&apos;d →</Link>
            <Link href="/llm-shells" className="human-button border border-[#5f7591] text-white hover:border-white">Find it in ChatGPT →</Link>
          </div>
        </div>
      </section>

      <HumanSiteFooter />
    </main>
  );
}
