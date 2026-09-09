'use client';

import Link from 'next/link';
import { HumanSiteFooter, HumanSiteHeader } from '@/components/HumanSiteShell';
import { HOME_DEMO_VIDEO_URL, homeDemoVideoReady } from '@/lib/homeDemo';
import { trackEvent } from '@/lib/track';

const PILLARS = [
  {
    label: 'Payroll',
    title: 'Labor before it becomes payroll.',
    copy: 'Photo the week. Labor cards name roles. Daily compare to the clock finds early leave, late leave, and labor drift — punch ≠ schedule.',
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
              Too many hats.
              <span className="block italic text-[#005de8]">Start with one problem.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#514b43] md:text-xl">
              The invoice you haven’t checked. The shift that ran late. The note nobody followed up on. Bring it to Never 86&apos;d and work through the next move, with the source beside the answer.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/onboard" className="human-button human-button-primary" onClick={() => trackEvent('home_hero_cta_click', { meta: { target: '/onboard', label: 'Claim the free owner seat' } })}>
                Claim the free owner seat →
              </Link>
              <Link href="/#demo" className="human-button human-button-secondary" onClick={() => trackEvent('home_hero_cta_click', { meta: { target: '/#demo', label: 'See how it works' } })}>
                See how it works
              </Link>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#514b43]">
              One owner seat. One restaurant. Free to start. No card. Your restaurant gets its own workspace.
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6f675e]">
              Already have a seat? <Link href="/login" className="underline-offset-4 hover:underline">Sign in</Link>
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
              ['1', 'Pick one job', 'Check an invoice, compare scheduled hours with the clock, or untangle a shift handoff.'],
              ['2', 'Bring what you have', 'Create your seat and add a file, photo, or note. You can connect a cloud account later.'],
              ['3', 'Get a receipt-backed move', 'Bring one real thing. See what changed, why it matters, what to do next, and what proves the fix.'],
            ].map(([number, title, copy]) => (
              <article key={number} className="rounded-2xl border border-[#33455c] bg-[#111b27] p-6">
                <p className="font-mono text-xs font-bold text-[#81aefc]">{number}</p>
                <h3 className="mt-6 font-serif text-3xl text-white">{title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#c6d1df]">{copy}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/onboard" className="human-button human-button-light">Claim the free owner seat →</Link>
            <Link href="/#demo" className="human-button border border-[#5f7591] text-white hover:border-white">See how it works</Link>
          </div>
        </div>
      </section>

      <section id="demo" className="border-t border-[#d8cec0] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="human-kicker">One job at a time</p>
            <h2 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-[#171717] md:text-7xl">
              Bring the paper.
              <span className="block italic text-[#005de8]">See the next move.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#514b43]">
              Start with one question. Never 86&apos;d checks the records you provide, shows what is missing, and helps you decide what to do next.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/onboard" className="human-button human-button-primary">Claim the free owner seat →</Link>
              <Link href="/login" className="human-button human-button-secondary">Already have a seat? Sign in</Link>
            </div>
          </div>

          {homeDemoVideoReady(HOME_DEMO_VIDEO_URL) ? (
            <div className="human-receipt-card border-[#005de8] bg-[#fffdf8] p-4 md:p-5">
              <video
                controls
                playsInline
                preload="metadata"
                src={HOME_DEMO_VIDEO_URL}
                className="aspect-video w-full rounded-xl bg-[#111b27]"
              >
                Your browser cannot play this recorded demo. Claim the free owner seat with email instead.
              </video>
            </div>
          ) : (
            <div className="human-receipt-card border-[#005de8] bg-[#fffdf8] p-7 md:p-9">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#005de8]">Example workflow · invoice check</p>
              <div className="mt-6 flex aspect-video items-center justify-center rounded-xl border border-dashed border-[#005de8] bg-[#f1f6ff] px-6 text-center">
                <p className="max-w-sm text-sm leading-relaxed text-[#514b43]">
                  Add two invoices from the same vendor. Check the SKU and pack size. Review a price change beside the original lines. Decide what to ask before your next order.
                </p>
              </div>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#766f65]">
                Your records · your decision · a clear next step
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="one-to-three" className="border-t border-[#d8cec0] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="human-kicker">For independent restaurants</p>
          <h2 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-[#171717] md:text-7xl">
            Owner seat first.
            <span className="block italic text-[#005de8]">Pay when you add seats.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#514b43]">
            This build is for independent operators running one to three locations. Seat 1 is the owner and stays free for one store. Seat 2 and seat 3 unlock when you bring in a GM or station lead. Multi-unit Command Center is a separate track.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              ['Seat 1', 'Owner', 'Free · one store · one login · morning action + night proof'],
              ['Seat 2', 'Manager / GM', 'Paid expansion · one manager login · no staff-wide PINs'],
              ['Seat 3', 'Kitchen / FOH / bar', 'Paid expansion · station templates owned by the manager seat'],
            ].map(([seat, role, copy]) => (
              <article key={seat} className="human-receipt-card">
                <p className="font-mono text-xs font-bold text-[#005de8]">{seat}</p>
                <h3 className="mt-8 font-serif text-3xl leading-tight text-[#1b1b1b]">{role}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#5b554d]">{copy}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/onboard" className="human-button human-button-primary">Claim the free owner seat →</Link>
            <Link href="/#demo" className="human-button human-button-secondary">See how it works</Link>
            <Link href="/pricing" className="human-button human-button-secondary">1–3 unit pricing</Link>
          </div>
        </div>
      </section>

      <HumanSiteFooter />
    </main>
  );
}
