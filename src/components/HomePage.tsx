'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { HumanSiteFooter, HumanSiteHeader, TeamFaces } from '@/components/HumanSiteShell';
import { MarketplaceCostSnapshot } from '@/components/MarketplaceCostSnapshot';
import { trackEvent } from '@/lib/track';

const FIELD_NOTES = [
  {
    image: '/field/on-the-line-exile.jpg',
    source: 'https://www.tiktok.com/@ontheline515/video/7675361848115399950',
    place: 'Exile Brewing Co. · Des Moines',
    title: 'The real product is the experience.',
    body: 'An operator conversation about the full room—not just the thing in the glass.',
  },
  {
    image: '/field/on-the-line-victor.jpg',
    source: 'https://www.tiktok.com/@ontheline515/video/7675120764261125406',
    place: 'On the Line 515 · Iowa',
    title: 'A lifestyle, not just a job.',
    body: 'Victor gets past the polished answer and into what hospitality actually asks of a person.',
  },
  {
    image: '/field/on-the-line-t12.jpg',
    source: 'https://www.tiktok.com/@ontheline515/video/7674310800135277838',
    place: 'T12 Distillery · Iowa',
    title: 'The turn nobody sees coming.',
    body: 'A construction career, a trip to Louisville, and the decision to build something local.',
  },
];

const TEAM = [
  {
    name: 'Myke Mueller',
    role: 'Founder · active operator',
    image: '/team/mm.jpg',
    copy: 'Still lives the restaurant week: floor, closeout, books, payroll, then back at it.',
  },
  {
    name: 'Victor Hatungimana',
    role: 'Field stories · On the Line 515',
    image: '/field/on-the-line-victor.jpg',
    copy: 'Gets Iowa owners, managers, and workers talking without sanding off the truth.',
  },
  {
    name: 'Kristin Aduna',
    role: 'Product discipline · operator discovery',
    image: '/team/kristin.jpg',
    copy: 'Turns restaurant pain and customer conversations into a product operators can actually use.',
  },
  {
    name: 'Rik Reinhardt',
    role: 'Cofounder · hospitality systems',
    image: '/team/rik.jpg',
    copy: 'Came up from dishwasher through operations and restaurant IT. Operators first, technology second.',
  },
];

export default function Home() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, restaurantName }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
      setMessage(data.message || "You're on the list.");
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  }

  return (
    <main className="human-page min-h-screen">
      <HumanSiteHeader />

      <section className="relative overflow-hidden px-5 pb-20 pt-12 md:px-8 md:pb-28 md:pt-20">
        <div className="human-grid-lines" aria-hidden />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <p className="human-kicker">One location · one seat free · software second</p>
            <h1 className="mt-6 max-w-4xl font-serif text-[clamp(3.8rem,8.5vw,7.8rem)] font-medium leading-[0.88] tracking-[-0.055em] text-[#161616]">
              Month-end is
              <span className="block italic text-[#005de8]">too late.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#514b43] md:text-xl">
              We built the tool we wanted behind the bar: yesterday&apos;s numbers, today&apos;s move, and the source attached. One seat is free. Agents across voids, labor, vendors, and 3P. No shame. No mystery. No software-company theater.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/trial" className="human-button human-button-primary" onClick={() => trackEvent('home_hero_cta_click', { meta: { target: '/trial', label: 'Claim one free seat' } })}>
                Claim one free seat →
              </Link>
              <Link href="/audit" className="human-button human-button-secondary" onClick={() => trackEvent('home_hero_cta_click', { meta: { target: '/audit', label: 'Audit one DoorDash statement' } })}>
                Audit one DoorDash statement
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-[#d8cec0] pt-5">
              <TeamFaces />
              <p className="max-w-md font-mono text-[10px] uppercase leading-relaxed tracking-[0.13em] text-[#6f675e]">
                Myke, Victor, Kristin, Rik, Vadim—and the operators who tell us when the screen is wrong.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[1.15fr_0.85fr] gap-3 md:gap-4">
            <a href={FIELD_NOTES[1].source} target="_blank" rel="noreferrer" className="human-photo group row-span-2 min-h-[510px]">
              <Image src={FIELD_NOTES[1].image} alt="Victor in an On the Line operator conversation" fill priority sizes="(max-width: 1024px) 58vw, 30vw" className="object-cover transition duration-500 group-hover:scale-[1.02]" />
              <span className="human-photo-caption">Victor · On the Line 515 · Iowa</span>
            </a>
            <a href={FIELD_NOTES[0].source} target="_blank" rel="noreferrer" className="human-photo group min-h-[245px]">
              <Image src={FIELD_NOTES[0].image} alt="On the Line conversation at Exile Brewing Co." fill priority sizes="(max-width: 1024px) 38vw, 20vw" className="object-cover transition duration-500 group-hover:scale-[1.02]" />
              <span className="human-photo-caption">On location · Des Moines</span>
            </a>
            <div className="human-note min-h-[245px]">
              <Image src="/team/mm.jpg" alt="Myke Mueller" width={80} height={80} className="h-20 w-20 rounded-full object-cover grayscale" />
              <p className="mt-5 font-serif text-2xl leading-tight text-[#f8f0e6]">“I became a tech builder because the tools weren&apos;t good enough.”</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[#b7c8df]">Myke · after close</p>
            </div>
          </div>
        </div>
      </section>

      <MarketplaceCostSnapshot pagePath="/" humanAuditHref="/audit#claim" />

      <section className="border-t border-[#d8cec0] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="human-kicker">One statement · four useful answers</p>
              <h2 className="mt-5 font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-[#171717] md:text-7xl">
                Not a pitch.
                <span className="block italic text-[#005de8]">A receipt.</span>
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#554f47]">
                DoorDash statement auditing is our strongest pilot. Uber Eats and Grubhub are early-access validation tracks. We tell you what the file supports, what it does not, and what record would answer the next question.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['01', 'What was deducted?', 'Commission, merchant fees, restaurant-funded promotions, refunds, adjustments, and other documented lines.'],
                ['02', 'What did the marketplace cost?', 'A statement-based effective marketplace cost—kept separate from any contract conclusion.'],
                ['03', 'What payout does the math support?', 'A sales-to-payout bridge from the numbers on the statement. A cash claim still needs matching bank evidence.'],
                ['04', 'What is still missing?', 'The agreement for a rate test. The deposit for a bank reconciliation. No pretending the missing record exists.'],
              ].map(([number, title, copy]) => (
                <article key={number} className="human-receipt-card">
                  <p className="font-mono text-xs font-bold text-[#005de8]">{number}</p>
                  <h3 className="mt-8 font-serif text-3xl leading-tight text-[#1b1b1b]">{title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-[#5b554d]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="human-dark-section px-5 py-20 md:px-8 md:py-28" id="built-on-the-floor">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="relative mx-auto w-full max-w-md">
            <div className="human-portrait-frame">
              <Image src="/field/myke-kitchen.jpg" alt="Myke Mueller in the Community Tap kitchen" width={1400} height={1089} className="h-auto w-full object-cover" />
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9fb0c6]">Myke Mueller · Fort Dodge, Iowa</p>
          </div>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#81aefc]">Built on the floor</p>
            <h2 className="mt-6 font-serif text-5xl leading-[0.96] tracking-[-0.04em] text-white md:text-7xl">
              I&apos;m the operator.
              <span className="block italic text-[#8db6ff]">That&apos;s why I&apos;m here.</span>
            </h2>
            <div className="mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-[#d7dfeb]">
              <p>
                I&apos;m Myke. I run Community Tap &amp; Pizza in Fort Dodge. I&apos;ve been an operator longer than I&apos;ve been a founder. Still am—the floor on Friday night, the books on Saturday morning.
              </p>
              <p>
                Never 86&apos;d grew from firsthand operating experience inside independent restaurants and a 28-location, private-equity-backed restaurant group. I did not become a builder because I loved dashboards. I got tired of finding the answer after the damage was done.
              </p>
              <p className="font-serif text-2xl italic text-white">Not more noise. Just the number, the proof, and the next move. No shame.</p>
            </div>
            <Link href="/story" className="human-button human-button-light mt-9">Read the whole story →</Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="human-kicker">From the floor · On the Line 515</p>
              <h2 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-[#171717] md:text-7xl">
                We listen before<span className="italic text-[#005de8]"> we build.</span>
              </h2>
            </div>
            <a href="https://www.tiktok.com/@ontheline515" target="_blank" rel="noreferrer" className="human-button human-button-secondary">Watch On the Line →</a>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {FIELD_NOTES.map((story) => (
              <a key={story.source} href={story.source} target="_blank" rel="noreferrer" className="group block">
                <div className="human-field-card">
                  <Image src={story.image} alt={story.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" />
                </div>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#726a61]">{story.place}</p>
                <h3 className="mt-2 font-serif text-3xl leading-tight text-[#1c1c1c]">{story.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5b554d]">{story.body}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#d8cec0] bg-[#ebe1d4] px-5 py-20 md:px-8 md:py-28" id="team">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="human-kicker">The people behind it</p>
            <h2 className="mt-5 font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-[#171717] md:text-7xl">
              Small team.<span className="block italic text-[#005de8]">Real restaurant scars.</span>
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((person) => (
              <article key={person.name} className="human-team-card">
                <div className="relative aspect-[4/4.5] overflow-hidden bg-[#d8cec0]">
                  <Image src={person.image} alt={person.name} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-2xl text-[#1b1b1b]">{person.name}</h3>
                  <p className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-[#005de8]">{person.role}</p>
                  <p className="mt-4 text-sm leading-relaxed text-[#5c554e]">{person.copy}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-3 border-l-4 border-[#005de8] bg-[#f7f1e8] p-5 text-sm leading-relaxed text-[#514b43] md:flex-row md:items-center md:justify-between">
            <p><strong className="text-[#1b1b1b]">Also around the table:</strong> Vadim and the build team turning operator questions into shipped work.</p>
            <Link href="/team" className="font-semibold text-[#005de8]">Meet the team →</Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 md:py-28" id="talk">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="human-kicker">Talk operator to operator</p>
            <h2 className="mt-5 font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-[#171717] md:text-6xl">
              Tell us the number<span className="block italic text-[#005de8]">you can&apos;t explain.</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[#585149]">No portal credentials. No giant setup. Start with one redacted report or one question. Myke reads the replies.</p>
          </div>

          {status === 'success' ? (
            <div className="human-receipt-card"><p className="font-serif text-3xl text-[#1b1b1b]">{message}</p></div>
          ) : (
            <form onSubmit={handleSubmit} className="human-contact-card space-y-4">
              <label className="block">
                <span className="human-form-label">Your name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className="human-input" placeholder="Myke Mueller" />
              </label>
              <label className="block">
                <span className="human-form-label">Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="human-input" placeholder="you@restaurant.com" />
              </label>
              <label className="block">
                <span className="human-form-label">Restaurant or group</span>
                <input value={restaurantName} onChange={(event) => setRestaurantName(event.target.value)} className="human-input" placeholder="The place you run" />
              </label>
              <button type="submit" disabled={status === 'loading'} className="human-button human-button-primary w-full disabled:opacity-50">
                {status === 'loading' ? 'Sending…' : 'Talk to Myke and the team →'}
              </button>
              <p className="text-xs leading-relaxed text-[#746d64]">
                Before sharing files, redact guest names, addresses, phones, emails, bank/account/routing numbers, card data, tax IDs, credentials, and unrelated identifiers.
              </p>
              {status === 'error' ? <p className="text-sm font-semibold text-red-700">{message}</p> : null}
            </form>
          )}
        </div>
      </section>

      <HumanSiteFooter />
    </main>
  );
}
