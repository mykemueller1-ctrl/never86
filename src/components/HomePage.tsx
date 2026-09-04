'use client';

import Link from 'next/link';
import { HumanSiteFooter, HumanSiteHeader } from '@/components/HumanSiteShell';
import { HOME_DEMO_VIDEO_URL, homeDemoVideoReady } from '@/lib/homeDemo';
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
              <Link href="/" className="human-button human-button-primary" onClick={() => trackEvent('home_hero_cta_click', { meta: { target: '/', label: 'Start playing' } })}>
                Start playing →
              </Link>
              <Link href="/onboard" className="human-button human-button-secondary" onClick={() => trackEvent('home_hero_cta_click', { meta: { target: '/onboard', label: 'Claim the free owner seat' } })}>
                Claim the free owner seat
              </Link>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#514b43]">
              Open play on the home page. Claim a free owner seat with email when you want your own login. Seat 1 is free for one store. No card. No password.
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6f675e]">
              Open now · Community Tap seat 1 · already have a seat? <Link href="/login" className="underline-offset-4 hover:underline">Sign in</Link>
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
              ['1', 'Watch the recorded demo', 'See the loop: find the leak, assign the fix, keep the receipt. No sandbox required to start.'],
              ['2', 'Give your email', 'Claim the free owner seat. We send a magic link. No password, card, or onboarding interview.'],
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
            <Link href="/#demo" className="human-button border border-[#5f7591] text-white hover:border-white">Watch the recorded demo</Link>
          </div>
        </div>
      </section>

      <section id="demo" className="border-t border-[#d8cec0] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="human-kicker">Recorded demo</p>
            <h2 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-[#171717] md:text-7xl">
              Watch the recorded demo.
              <span className="block italic text-[#005de8]">Then give your email.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#514b43]">
              Strangers do not need a sandbox. Watch the recorded demo, then claim the free owner seat with your email. The magic link is the door.
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
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#005de8]">Demo placeholder</p>
              <div className="mt-6 flex aspect-video items-center justify-center rounded-xl border border-dashed border-[#005de8] bg-[#f1f6ff] px-6 text-center">
                <p className="max-w-sm text-sm leading-relaxed text-[#514b43]">
                  The hosted recorded demo is not on this page yet. No fake player. Watch it here when the URL is set — until then, give your email and claim the free owner seat.
                </p>
              </div>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#766f65]">
                Watch the recorded demo, then give your email
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="one-to-three" className="border-t border-[#d8cec0] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="human-kicker">1–3 unit ICP · not Command Center</p>
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
            <Link href="/" className="human-button human-button-primary">Start playing →</Link>
            <Link href="/onboard" className="human-button human-button-secondary">Claim the free owner seat →</Link>
            <Link href="/operator" className="human-button human-button-secondary">Try Owner desk →</Link>
            <Link href="/action-shift" className="human-button human-button-secondary">See Action Shift seats</Link>
            <Link href="/pricing" className="human-button human-button-secondary">1–3 unit pricing</Link>
            <Link href="/command-center" className="human-button human-button-secondary">Multi-unit Command Center →</Link>
          </div>
        </div>
      </section>

      <HumanSiteFooter />
    </main>
  );
}
