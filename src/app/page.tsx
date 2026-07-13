'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/track';
import RoiCalculator from '@/components/RoiCalculator';

const FREE_AGENTS = [
  { name: 'Void Hunter',    href: '/demo/void-hunter',    tag: 'Voids',    line: 'One name above the peer band, by store + cross-network.' },
  { name: '3P Fee Finder',  href: '/demo/3p-fee-finder',  tag: 'Delivery', line: 'Contract vs blended-effective DD/UE/GH take rate.' },
  { name: 'Labor Leak',     href: '/demo/labor-leak',     tag: 'Labor',    line: 'OT drift, ghost shifts, schedule-vs-clocked gaps.' },
  { name: 'Tip Variance',   href: '/demo/tip-variance',   tag: 'Tips',     line: 'Week-over-week tip movement, per store + per name.' },
  { name: 'Catering Leak',  href: '/demo/catering-leak',  tag: 'Catering', line: 'Per-store catering economics + invoice-vs-POS reconciliation gap.' },
  { name: 'Rate Card Audit',href: '/demo/rate-card-audit',tag: '3P Rates', line: 'Where your DD/UE/GH rates sit vs peer band.' },
  { name: 'Shift Pulse',    href: '/demo/shift-pulse',    tag: 'Shift',    line: 'Crew + manager sentiment at the close of every shift.' },
];

const SEATS = [
  { h: 'A', name: 'All',     tag: 'Overview', href: '/for', active: true },
  { h: 'C', name: 'CEO',     tag: 'Network',  href: '/for/ceo' },
  { h: 'F', name: 'CFO',     tag: 'Books',    href: '/for/cfo' },
  { h: 'O', name: 'COO',     tag: 'Drift',    href: '/for/coo' },
  { h: 'K', name: 'Chef',    tag: 'Kitchen',  href: '/for/chef' },
  { h: 'W', name: 'Owner',   tag: 'Solo',     href: '/for/owner' },
  { h: 'M', name: 'Manager', tag: 'Floor',    href: '/for/manager' },
  { h: 'R', name: 'Crew',    tag: 'Shift',    href: '/for/crew' },
];

const OPERATOR_DROPDOWN = [
  { name: 'CEO',     tag: 'Network',     href: '/for/ceo',  blurb: 'One screen ranked by what costs you money this week.' },
  { name: 'CFO',     tag: 'Books',       href: '/for/cfo',  blurb: 'Books that close to the penny. Every figure source-tagged.' },
  { name: 'COO · Ops', tag: 'Drift',     href: '/for/coo',  blurb: 'Labor leak before payroll posts. Voids named, ranked, coachable.' },
  { name: 'Chef',    tag: 'Kitchen',     href: '/for/chef', blurb: 'The chef who runs the books. The line that doesn\'t lie.' },
  { name: 'Owner',   tag: 'Solo',        href: '/for/owner',blurb: 'Solo operator. Same screen as the chain. None of the enterprise price.' },
];

const SECTIONS = [
  { n: '01', label: 'The story', href: '#who' },
  { n: '02', label: 'What we offer', href: '#offer-tiers' },
  { n: '03', label: "Myke's story", href: '#myke' },
  { n: '04', label: 'What we do', href: '#what' },
  { n: '05', label: 'Free agents', href: '#agents' },
  { n: '06', label: 'Pick your seat', href: '#seats' },
];

export default function Home() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Operator dropdown state
  const [opOpen, setOpOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Scroll reveal — fade + rise each [data-reveal] section into view once.
  // One observer for the whole page; unobserves after reveal so it never
  // re-triggers. Reduced-motion users get everything visible via CSS.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window) || els.length === 0) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, restaurantName }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message || "You're on the list.");
      } else {
        throw new Error(data.error);
      }
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <main className="compass min-h-screen">
      {/* Top brand row */}
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <span className="compass-mark">N</span>
            <div>
              <p className="font-serif text-[28px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">for operators</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">
                See where your restaurant is losing money · 8 tools free to try
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[13px] text-white tabular-nums">$1.81M SURFACED · 545,677 ORDERS</p>
            <p className="compass-eyebrow-dim mt-1">
              MULTI-MARKET NETWORK <span className="ml-3"><span className="compass-live-dot" />LIVE</span>
            </p>
          </div>
        </div>

        {/* Top tab nav — Agents · For Operators ▾ · Pricing · Trial · Sign in */}
        <nav className="mt-6 flex flex-wrap items-center gap-2 text-[14px]" ref={dropRef}>
          <Link href="/agents" onClick={() => trackEvent('home_nav_click', { meta: { target: '/agents', label: 'Agents' } })} className="px-4 py-2 rounded-full text-white hover:bg-white/[0.06] transition-colors">Agents</Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => { setOpOpen((v) => { const next = !v; if (next) trackEvent('home_nav_dropdown_open', { meta: { label: 'For multi-unit operators' } }); return next; }); }}
              className="px-4 py-2 rounded-full text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1.5"
              aria-expanded={opOpen}
              aria-haspopup="menu"
            >
              For multi-unit operators
              <span className="text-[10px]" style={{ color: '#0066ff' }}>{opOpen ? '▴' : '▾'}</span>
            </button>
            {opOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 z-50 bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-2 shadow-2xl">
                {OPERATOR_DROPDOWN.map((o) => (
                  <Link
                    key={o.name}
                    href={o.href}
                    onClick={() => { trackEvent('home_nav_dropdown_item_click', { meta: { target: o.href, label: o.name } }); setOpOpen(false); }}
                    className="block px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-serif text-lg text-white">{o.name}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#0066ff' }}>{o.tag}</p>
                    </div>
                    <p className="text-[13px] mt-1" style={{ color: '#86868b' }}>{o.blurb}</p>
                  </Link>
                ))}
                <Link
                  href="/for"
                  onClick={() => { trackEvent('home_nav_dropdown_item_click', { meta: { target: '/for', label: 'All seven seats' } }); setOpOpen(false); }}
                  className="block px-4 py-2 mt-1 border-t border-[#1f1f1f] text-[13px]"
                  style={{ color: '#0066ff' }}
                >
                  All seven seats →
                </Link>
              </div>
            )}
          </div>

          <Link href="/pricing"   onClick={() => trackEvent('home_nav_click', { meta: { target: '/pricing', label: 'Pricing' } })}      className="px-4 py-2 rounded-full text-white hover:bg-white/[0.06] transition-colors">Pricing</Link>
          <Link href="/trial"     onClick={() => trackEvent('home_nav_click', { meta: { target: '/trial', label: 'Trial' } })}          className="px-4 py-2 rounded-full text-white hover:bg-white/[0.06] transition-colors">Trial</Link>
          <Link href="/team"      onClick={() => trackEvent('home_nav_click', { meta: { target: '/team', label: 'Team' } })}            className="px-4 py-2 rounded-full text-white hover:bg-white/[0.06] transition-colors">Team</Link>
          <span className="flex-1" />
          <Link href="/login" onClick={() => trackEvent('home_nav_click', { meta: { target: '/login', label: 'Sign in' } })} className="px-4 py-2 rounded-full text-white font-medium hover:bg-white/[0.06] transition-colors">Sign in</Link>
        </nav>

        {/* Persona pill row */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {SEATS.map((s) => (
            <Link
              key={s.name}
              href={s.href}
              onClick={() => trackEvent('home_persona_pill_click', { meta: { role: s.name, target: s.href, tag: s.tag, position: 'top_row' } })}
              className={`compass-pill ${s.active ? 'is-active' : ''}`}
            >
              <span className="avatar">{s.h}</span>
              <span>{s.name}</span>
              <span className="tag">{s.tag}</span>
            </Link>
          ))}
        </div>

        {/* Numbered section nav */}
        <nav className="compass-section-nav mt-6">
          {SECTIONS.map((s) => (
            <Link key={s.n} href={s.href}>
              <span className="num">{s.n}</span>
              <span>{s.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-16 md:pb-20">
        <div className="n86-hero-glow" aria-hidden />
        <p className="compass-eyebrow mb-6 relative z-10">— For restaurant owners and operators</p>
        <div className="relative z-10 grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-16 items-start">
          <div className="n86-hero-enter">
            <h1 className="compass-display text-5xl md:text-7xl lg:text-[88px] mb-10">
              Find the leak. <em>Name who</em><br />
              owns it. <em>Keep</em> the receipt.
            </h1>
            <p className="compass-body text-lg md:text-xl max-w-2xl">
              Send us a sales report from your register. In 30 seconds we show you where money is
              slipping away — which store, which shift, whose name — and what to do about it.
              No spreadsheets. No waiting on the accountant.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/trial" onClick={() => trackEvent('home_hero_cta_click', { meta: { target: '/trial', label: 'Try it free — no card', variant: 'primary' } })} className="btn-primary" style={{ background: '#0066ff' }}>
                Try it free — no card needed →
              </Link>
              <Link href="/pricing" onClick={() => trackEvent('home_hero_cta_click', { meta: { target: '/pricing', label: 'See pricing', variant: 'secondary' } })} className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>
                See pricing
              </Link>
            </div>
          </div>

          <aside className="compass-card">
            <p className="compass-card-label">Who it&apos;s for</p>
            <h3>You. The owner.</h3>
            <p className="compass-eyebrow mb-4" style={{ letterSpacing: '0.08em' }}>
              The one who signs the checks
            </p>
            <p className="compass-body text-[14.5px]">
              You run the floor, the books, and the schedule — often all in the same day.
              This is your 30-second morning read on where the money actually went,
              in plain English.
            </p>
          </aside>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
          <div className="compass-kpi">
            <p className="compass-kpi-label">Money found</p>
            <p className="compass-kpi-val">$<span>1.81</span><span className="unit">M</span></p>
          </div>
          <div className="compass-kpi">
            <p className="compass-kpi-label">Orders checked</p>
            <p className="compass-kpi-val">545<span className="unit">,677</span></p>
          </div>
          <div className="compass-kpi">
            <p className="compass-kpi-label">Tools free to try</p>
            <p className="compass-kpi-val">8<span className="unit">/24</span></p>
          </div>
          <div className="compass-kpi">
            <p className="compass-kpi-label">Set up yourself in</p>
            <p className="compass-kpi-val">15<span className="unit">min</span></p>
          </div>
        </div>
      </section>

      {/* PROOF · see the actual output */}
      <section data-reveal className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="compass-eyebrow mb-4">— See it work · Void Hunter</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-4">
            It doesn&apos;t say voids are up. <em>It names who.</em>
          </h2>
          <p className="compass-body text-lg max-w-2xl mb-12">
            A sample 5-store group — real math, names hidden. The same tool checked <span className="text-white font-semibold">$15.72M across 545,677 real orders</span> for our first partner and found <span className="text-white font-semibold">$1.81M</span> in leaks, every dollar traced back to its source. On your own report it runs in 30 seconds at <Link href="/trial" className="underline" style={{ textDecorationColor: '#0066ff' }}>the free trial</Link> — and it names <em>your</em> stores, not these.
          </p>

          <div className="grid lg:grid-cols-[340px_1fr] gap-4">
            {/* The verdict */}
            <div className="compass-card flex flex-col justify-between" style={{ borderColor: '#0066ff' }}>
              <div>
                <p className="compass-card-label" style={{ color: '#0066ff' }}>— The name</p>
                <p className="font-serif text-4xl md:text-5xl text-white mt-3 leading-none" style={{ letterSpacing: '-0.02em' }}>Server&nbsp;#14</p>
                <p className="compass-body text-[14px] mt-2" style={{ color: '#86868b' }}>Downtown · 41 voided items · $4,200 in voids</p>
              </div>
              <div className="mt-8">
                <p className="font-mono text-[13px]" style={{ color: '#6e6e73' }}>EXCESS ABOVE PEER BAND · ANNUALIZED</p>
                <p className="font-serif text-4xl text-white mt-1" style={{ letterSpacing: '-0.02em' }}>~$21,600<span className="text-[20px]" style={{ color: '#6e6e73' }}>/yr</span></p>
                <div className="flex gap-2 mt-4">
                  <span className="font-mono text-[11px] px-2 py-1 rounded-md" style={{ background: 'rgba(52,199,89,0.10)', color: '#34c759', border: '1px solid rgba(52,199,89,0.25)' }}>VERIFIED · void counts</span>
                  <span className="font-mono text-[11px] px-2 py-1 rounded-md" style={{ background: 'rgba(255,149,0,0.10)', color: '#ff9500', border: '1px solid rgba(255,149,0,0.25)' }}>ESTIMATED · annualized</span>
                </div>
              </div>
            </div>

            {/* The store table */}
            <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
              <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-wrap gap-2">
                <p className="compass-card-label">— 5 stores · void rate vs peer band</p>
                <p className="font-mono text-[12px]" style={{ color: '#6e6e73' }}>PEER MEDIAN 0.51%</p>
              </div>
              <table className="w-full text-[14px]">
                <tbody>
                  {[
                    { store: 'Downtown',  rate: '1.24%', bar: 100, flagged: true },
                    { store: 'University',rate: '0.70%', bar: 56,  flagged: false },
                    { store: 'Riverside', rate: '0.51%', bar: 41,  flagged: false },
                    { store: 'Midtown',   rate: '0.40%', bar: 32,  flagged: false },
                    { store: 'Airport',   rate: '0.30%', bar: 24,  flagged: false },
                  ].map((r) => (
                    <tr key={r.store} style={{ borderTop: '1px solid #1f1f1f' }}>
                      <td className="px-5 py-3 text-white font-medium whitespace-nowrap" style={{ width: 130 }}>
                        {r.store}
                        {r.flagged && <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,102,255,0.14)', color: '#0066ff' }}>ABOVE BAND</span>}
                      </td>
                      <td className="px-3 py-3" style={{ width: '100%' }}>
                        <div className="h-2 rounded-full" style={{ width: `${r.bar}%`, background: r.flagged ? '#0066ff' : '#2c2c2e', transition: 'width 900ms cubic-bezier(0.16,1,0.3,1)' }} />
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums whitespace-nowrap" style={{ color: r.flagged ? '#ffffff' : '#86868b', width: 80 }}>{r.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderTop: '1px solid #1f1f1f' }}>
                <p className="compass-body text-[13px]" style={{ color: '#86868b' }}>One store above the band. One name inside it. That&apos;s the whole job.</p>
                <Link href="/trial" onClick={() => trackEvent('home_proof_cta_click', { meta: { target: '/trial', label: 'Run it on your numbers' } })} className="btn-primary text-[13px]" style={{ background: '#0066ff' }}>Run it on your numbers →</Link>
              </div>
            </div>
          </div>

          {/* Two more agents · same job, different leak */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {/* Tip Variance */}
            <div className="compass-card">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="compass-card-label" style={{ color: '#0066ff' }}>— See it work · Tip Variance</p>
                <p className="font-mono text-[12px]" style={{ color: '#6e6e73' }}>NETWORK −8.2% WoW</p>
              </div>
              <h3 className="!mt-3 text-2xl">It names whose tips fell.</h3>
              <div className="mt-5 flex items-baseline gap-3 flex-wrap">
                <p className="font-serif text-3xl md:text-4xl text-white leading-none" style={{ letterSpacing: '-0.02em' }}>Server&nbsp;#9</p>
                <span className="font-mono text-[13px]" style={{ color: '#86868b' }}>University · server</span>
              </div>
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <p className="font-serif text-2xl" style={{ color: '#ff453a' }}>−31%</p>
                <p className="font-mono text-[13px]" style={{ color: '#86868b' }}>$980 this week · $1,420 last</p>
              </div>
              <div className="flex gap-2 mt-5">
                <span className="font-mono text-[11px] px-2 py-1 rounded-md" style={{ background: 'rgba(52,199,89,0.10)', color: '#34c759', border: '1px solid rgba(52,199,89,0.25)' }}>VERIFIED · tip totals</span>
                <span className="font-mono text-[11px] px-2 py-1 rounded-md" style={{ background: 'rgba(255,149,0,0.10)', color: '#ff9500', border: '1px solid rgba(255,149,0,0.25)' }}>ESTIMATED · WoW delta</span>
              </div>
            </div>

            {/* Vendor Drift */}
            <div className="compass-card">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="compass-card-label" style={{ color: '#0066ff' }}>— See it work · Vendor Drift</p>
                <p className="font-mono text-[12px]" style={{ color: '#6e6e73' }}>APR → MAY</p>
              </div>
              <h3 className="!mt-3 text-2xl">It names the SKU and the cheaper vendor.</h3>
              <div className="mt-5">
                <p className="font-serif text-2xl md:text-[28px] text-white leading-tight" style={{ letterSpacing: '-0.015em' }}>Mozzarella LMPS 6/5 LB</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="font-mono text-[11px]" style={{ color: '#6e6e73' }}>PFG · DRIFTING</p>
                  <p className="font-serif text-xl text-white mt-0.5">$2.37 <span className="text-[14px]" style={{ color: '#ff453a' }}>+7.2%</span></p>
                </div>
                <div>
                  <p className="font-mono text-[11px]" style={{ color: '#6e6e73' }}>SYSCO · HELD</p>
                  <p className="font-serif text-xl text-white mt-0.5">$1.96 <span className="text-[14px]" style={{ color: '#34c759' }}>17% under PFG</span></p>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <span className="font-mono text-[11px] px-2 py-1 rounded-md" style={{ background: 'rgba(52,199,89,0.10)', color: '#34c759', border: '1px solid rgba(52,199,89,0.25)' }}>VERIFIED · invoice prices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI · what a few points is worth */}
      <section data-reveal className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="compass-eyebrow mb-4">— The math</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-4">
            What&apos;s a few points <em>worth to you?</em>
          </h2>
          <p className="compass-body text-lg max-w-2xl mb-12">
            Drop in your monthly sales. Every point of food cost we help you claw back is real money — and it dwarfs the price.
          </p>
          <RoiCalculator />
        </div>
      </section>

      {/* § 01 · THE STORY */}
      <section id="who" data-reveal className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20">
          <div>
            <p className="compass-eyebrow mb-4">— 01 · The story</p>
            <h2 className="compass-display text-4xl md:text-6xl">
              Built by an operator. <em>For operators.</em>
            </h2>
          </div>
          <div className="space-y-7 compass-body text-lg leading-relaxed max-w-2xl">
            <p>
              Never 86&apos;d started as the calculator we made for our own restaurant — <span className="text-white font-semibold">Community Tap &amp; Pizza, Fort Dodge, Iowa</span>. Myke Mueller (founder) was an operator first, founder second. Still is.
            </p>
            <p>
              The first version was an HTML page open on Myke&apos;s laptop on a Tuesday at 11pm trying to figure out why food cost drifted four points week-over-week. The math caught it. So did the next leak. And the next.
            </p>
            <p>
              We now serve a <span className="text-white font-semibold">16-unit chef-led group</span> as our first design partner. $15.72M reconciled across 545,677 orders. $1.81M recovery surface, sourced to the cent.
            </p>
            <p>
              The rule that runs the company: <span className="text-white font-semibold">when our model is wrong, we publish the correction.</span> The first time it happened we walked an $8.3M number down to $1.81M, in writing, to the design partner who&apos;d already seen the original figure. That&apos;s why they stayed. <Link href="/case/walked-the-number-back" onClick={() => trackEvent('home_case_link_click', { meta: { target: '/case/walked-the-number-back', label: 'Read the case · $1.81M walkback' } })} className="underline" style={{ textDecorationColor: '#0066ff' }}>Read the case.</Link>
            </p>
            <p>
              Today we serve the whole ladder — <span className="text-white font-semibold">solo operator on one Toast terminal, all the way to a CEO running 50 stores across three brands.</span> Same source-tag discipline. Same operator-first ethos. The price scales; the rule doesn&apos;t.
            </p>
          </div>
        </div>
      </section>

      {/* § 02 · WHAT WE OFFER — independent → enterprise */}
      <section id="offer-tiers" data-reveal className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="compass-eyebrow mb-4">— 02 · What we offer</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-6">
            From the solo operator <em>to the C-suite.</em>
          </h2>
          <p className="compass-body text-lg max-w-3xl mb-14">
            Two ways to use it. <span className="text-white font-semibold">Pulse</span> is for a 1–2 store operator — it shows your prime cost (food and labor as a share of sales) every morning, names the leak, and tells you the fix. $199/mo. <span className="text-white font-semibold">The full system</span> runs an entire multi-store group, and it&apos;s live inside a 16-unit chef-led group today. Not sure which fits? Start with the free trial — everyone does.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            <div className="compass-card flex flex-col">
              <p className="compass-card-label">— Free trial</p>
              <h3>Start here. Free.</h3>
              <p className="compass-body text-[14px] mt-3 mb-5">
                One store, doing the ops, the books, and the floor yourself at 11pm? Send one sales report and see your leak in 30 seconds. No card.
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>60-minute free trial · one sales report · no card</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>All 8 tools free to try (Void Hunter · Leak Detector · Labor Drift · Tip Variance · Catering Leak · Beverage Cost · Vendor Drift · Refund Auditor)</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>Direct line to the founder</span></li>
              </ul>
              <Link href="/trial" onClick={() => trackEvent('home_audience_cta_click', { meta: { tier: 'trial', target: '/trial', label: 'Start the trial' } })} className="btn-secondary mt-auto" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff', border: '1px solid #2c2c2e' }}>
                Start the trial
              </Link>
            </div>

            <div className="compass-card flex flex-col" style={{ borderColor: '#0066ff' }}>
              <p className="compass-card-label" style={{ color: '#0066ff' }}>— Pulse · $199/mo</p>
              <h3>1–2 units. Your prime cost, daily.</h3>
              <p className="compass-body text-[14px] mt-3 mb-5">
                Most independents see prime cost when the accountant sends it — weeks late. Pulse shows it every morning, wired to your live POS, with one coach card per leak telling you what to do.
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#0066ff' }}>✓</span><span>Daily food cost · 30/60/90-day prime cost trend</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#0066ff' }}>✓</span><span>Cross-vendor cheapest-price compare · per-name alerts</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#0066ff' }}>✓</span><span>A coach card per leak — what to do, not just what broke</span></li>
              </ul>
              <Link href="/onboard" onClick={() => trackEvent('home_audience_cta_click', { meta: { tier: 'pulse', target: '/onboard', label: 'Join the Pulse waitlist' } })} className="btn-primary mt-auto" style={{ background: '#0066ff' }}>
                Join the Pulse waitlist →
              </Link>
            </div>

            <div className="compass-card flex flex-col">
              <p className="compass-card-label">— Operator Suite · $999/mo</p>
              <h3>3–9 units. Full native starts here.</h3>
              <p className="compass-body text-[14px] mt-3 mb-5">
                The full operating system at group scale. Everything in Pulse, plus the network view — peer bands across your fleet, per-role lenses for CFO / COO / Chef / Owner, roll-up and drill-down.
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>Peer-band analysis across your fleet</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>Per-role lenses · CEO · CFO · COO · Chef · Owner</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>Slack + Teams integration · unlimited history</span></li>
              </ul>
              <Link href="/onboard" onClick={() => trackEvent('home_audience_cta_click', { meta: { tier: 'operator_suite', target: '/onboard', label: 'Talk to us' } })} className="btn-secondary mt-auto" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff', border: '1px solid #2c2c2e' }}>
                Talk to us
              </Link>
            </div>

            <div className="compass-card flex flex-col">
              <p className="compass-card-label">— Enterprise · 10+ units</p>
              <h3>Multi-brand. Full native.</h3>
              <p className="compass-body text-[14px] mt-3 mb-5">
                The whole operating system under your brands — per-brand isolation, SSO, custom POS integrations. Running inside a 16-unit chef-led group today. We don&apos;t publish the rest — email Myke.
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>Per-brand tenant isolation</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>SSO · Okta / Azure AD / Google · custom POS (Aloha · PDQ)</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>Quarterly business review with the founder</span></li>
              </ul>
              <a href="mailto:myke@n86.app?subject=Enterprise%20pricing" onClick={() => trackEvent('home_audience_cta_click', { meta: { tier: 'enterprise', target: 'mailto', label: 'Email myke@n86.app' } })} className="btn-secondary mt-auto" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff', border: '1px solid #2c2c2e' }}>
                Email myke@n86.app
              </a>
            </div>
          </div>

          <p className="compass-eyebrow-dim text-center">— Same source-tag discipline at every tier. The price scales; the rule doesn&apos;t.</p>
        </div>
      </section>

      {/* § 03 · MYKE'S STORY — first-person */}
      <section id="myke" data-reveal className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="compass-eyebrow mb-4">— 03 · Myke&apos;s story</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-10">
            I built this <em>for myself first.</em>
          </h2>
          <div className="space-y-6 compass-body text-lg leading-relaxed">
            <p>
              I&apos;m Myke. I run <span className="text-white font-semibold">Community Tap &amp; Pizza in Fort Dodge, Iowa</span>. I&apos;ve been an operator longer than I&apos;ve been a founder. Still am — the floor on Friday night, the books on Saturday morning.
            </p>
            <p>
              I started building Never 86&apos;d because nobody was making the screen I actually wanted. Every restaurant tech vendor either sold me a dashboard I had to interpret myself, or charged me enterprise prices for software built for the office, not the line.
            </p>
            <p>
              The first version was a single HTML file on my laptop. I was trying to figure out why food cost drifted four points one week and nobody could explain it. I wrote the math, fed in my own Z-reports, and it pointed at the right station. Then it pointed at the next leak. Then the next.
            </p>
            <p>
              <span className="text-white font-semibold">I knew it was a real product the day a chef-led 16-unit group asked if I could run it on their data.</span> I did. The first number we produced was wrong — overstated by $6.5M. So I walked it back, in writing, in front of them. That&apos;s when I knew the discipline of publishing corrections was the actual product.
            </p>
            <p>
              Now I&apos;m building it for everybody from the solo operator to the 50-unit CEO. Same code. Same source-tag rule. Same operator-to-operator language. <span className="text-white font-semibold">If something on the screen doesn&apos;t make sense, you can email me directly. <a href="mailto:myke@n86.app" className="underline" style={{ textDecorationColor: '#0066ff' }}>myke@n86.app</a>.</span>
            </p>
            <p style={{ color: '#86868b' }}>— Myke Mueller · Fort Dodge, Iowa</p>
          </div>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section id="what" data-reveal className="border-t border-[#1f1f1f] py-20 md:py-28 px-6 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="max-w-7xl mx-auto">
          <p className="compass-eyebrow mb-4">— 04 · What we do</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-14">
            We sit on top of the systems you run<br />
            and tell you <em>where the numbers stop agreeing.</em>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
            <div className="compass-card">
              <p className="compass-card-label">— What we are not</p>
              <h3>Not a dashboard.</h3>
              <p className="compass-body text-[14px] mt-3">
                Dashboards make you read a chart and decide what to do. We name the leak, point at the store, name the person, and tell you the next move.
              </p>
            </div>
            <div className="compass-card">
              <p className="compass-card-label">— What we are not</p>
              <h3>Not a CRM.</h3>
              <p className="compass-body text-[14px] mt-3">
                Your POS already knows everything that happened. We sit next to it and tell you which of those things were a leak, by store and by name.
              </p>
            </div>
            <div className="compass-card">
              <p className="compass-card-label">— What we are not</p>
              <h3>Not a replacement.</h3>
              <p className="compass-body text-[14px] mt-3">
                Keep Toast, R365, 7shifts, Thanx, Marqii. We don&apos;t rip anything out. We sit on top of the stack you have and reconcile across it.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mb-12">
            <div className="compass-card" style={{ borderColor: '#0066ff' }}>
              <p className="compass-card-label" style={{ color: '#0066ff' }}>— What we are</p>
              <h3>The Operator OS.</h3>
              <p className="compass-body text-[15px] mt-3 leading-relaxed">
                Tools that watch your sales, labor, voids, delivery fees, tips, catering, and how shifts are going. One simple screen per person. We label every number <span style={{ color: '#34c759' }} className="font-semibold">Verified</span> (confirmed), <span style={{ color: '#ff9500' }} className="font-semibold">Estimated</span> (our best math), or <span style={{ color: '#ff453a' }} className="font-semibold">Unverified</span> (still a guess) — so you always know what&apos;s solid. When we get one wrong, we tell you and fix it.
              </p>
            </div>
            <div className="compass-card">
              <p className="compass-card-label">— How it works</p>
              <h3>30 seconds to first leak.</h3>
              <p className="compass-body text-[15px] mt-3 leading-relaxed">
                Send a report from Toast, Square, Clover, or PDQ at <Link href="/trial" onClick={() => trackEvent('home_inline_trial_link_click', { meta: { target: '/trial', label: '/trial inline' } })} className="underline text-white" style={{ textDecorationColor: '#0066ff' }}>the free trial</Link>. Two tools run on your real numbers right away — a 60-minute live look, no card, no salesperson. Like it? We&apos;ll connect it straight to your register so it updates on its own.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {FREE_AGENTS.map((a) => (
              <Link key={a.name} href={a.href} className="compass-card text-center hover:border-[#0066ff] transition-colors block">
                <p className="compass-card-label">{a.tag}</p>
                <p className="font-serif text-[15px] mt-2 text-white leading-tight">{a.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Free agents */}
      <section id="agents" data-reveal className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="compass-eyebrow mb-4">— 05 · Free agents</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-12">
            Try one. <em>Right now.</em>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FREE_AGENTS.map((a) => (
              <Link key={a.name} href={a.href} className="compass-card hover:border-[#0066ff] transition-colors block group">
                <p className="compass-card-label">{a.tag}</p>
                <h3 className="!mt-3">{a.name}</h3>
                <p className="compass-body text-[14px] mt-3">{a.line}</p>
                <p className="compass-body text-[14px] mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#0066ff' }}>
                  Try it free <span aria-hidden>→</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pick your seat */}
      <section id="seats" data-reveal className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="compass-eyebrow mb-4">— 06 · Pick your seat</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-12">
            One system. <em>Seven roles.</em>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {SEATS.slice(1).map((s) => (
              <Link key={s.name} href={s.href} onClick={() => trackEvent('home_persona_pill_click', { meta: { role: s.name, target: s.href, tag: s.tag, position: 'pick_seat_grid' } })} className="compass-card hover:border-[#0066ff] transition-colors text-center block">
                <p className="compass-card-label">{s.tag}</p>
                <p className="font-serif text-2xl md:text-3xl mt-2 text-white">{s.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Talk to us */}
      <section id="offer" data-reveal className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="compass-eyebrow mb-4 text-center">— 07 · 15 minutes</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-10 text-center">
            One call. <em>One signal.</em>
          </h2>
          {status === 'success' ? (
            <div className="compass-card text-center">
              <p className="font-serif text-2xl text-white">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="compass-card space-y-3">
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
              <input type="text" placeholder="Restaurant or group" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
              <button type="submit" disabled={status === 'loading'} className="btn-primary w-full disabled:opacity-50" style={{ background: '#0066ff' }}>
                {status === 'loading' ? 'Sending…' : 'Talk to us'}
              </button>
              {status === 'error' && <p className="text-[#ff453a] text-sm text-center">{message}</p>}
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/for"     onClick={() => trackEvent('home_footer_click', { meta: { target: '/for', label: 'Seats' } })}        className="hover:text-white transition-colors">Seats</Link>
            <Link href="/people"  onClick={() => trackEvent('home_footer_click', { meta: { target: '/people', label: 'People' } })}    className="hover:text-white transition-colors">People</Link>
            <Link href="/onboard" onClick={() => trackEvent('home_footer_click', { meta: { target: '/onboard', label: 'Onboard' } })}  className="hover:text-white transition-colors">Onboard</Link>
            <Link href="/changelog" onClick={() => trackEvent('home_footer_click', { meta: { target: '/changelog', label: 'Changelog' } })} className="hover:text-white transition-colors">Changelog</Link>
            <Link href="/login" onClick={() => trackEvent('home_footer_click', { meta: { target: '/login', label: 'Sign in' } })} className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
