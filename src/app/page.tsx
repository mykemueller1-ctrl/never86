'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/track';

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
                Operator OS · 24-agent workforce · 7 free to try
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[13px] text-white tabular-nums">$1.81M RECOVERED · 545,677 ORDERS</p>
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
          <span className="flex-1" />
          <Link href="/reports/login" onClick={() => trackEvent('home_nav_click', { meta: { target: '/reports/login', label: 'Sign in' } })} className="px-4 py-2 rounded-full text-white font-medium hover:bg-white/[0.06] transition-colors">Sign in</Link>
        </nav>

        {/* Persona pill row */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {SEATS.map((s) => (
            <Link
              key={s.name}
              href={s.href}
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
      <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-16 md:pb-20">
        <p className="compass-eyebrow mb-6">— Operator OS · Network Operating Layer</p>
        <div className="grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-16 items-start">
          <div>
            <h1 className="compass-display text-5xl md:text-7xl lg:text-[88px] mb-10">
              Find the leak. <em>Name who</em><br />
              owns it. <em>Keep</em> the receipt.
            </h1>
            <p className="compass-body text-lg md:text-xl max-w-2xl">
              Seven agents read your sales, labor, voids, 3P fees, tips, catering, and shift sentiment.
              Every figure source-tagged. Every recovery owned by a name. The platform every operator wishes their POS gave them.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/trial" onClick={() => trackEvent('home_hero_cta_click', { meta: { target: '/trial', label: '60 minutes free · drop a CSV', variant: 'primary' } })} className="btn-primary" style={{ background: '#0066ff' }}>
                60 minutes free · drop a CSV →
              </Link>
              <Link href="/pricing" onClick={() => trackEvent('home_hero_cta_click', { meta: { target: '/pricing', label: 'See pricing', variant: 'secondary' } })} className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>
                See pricing
              </Link>
            </div>
          </div>

          <aside className="compass-card">
            <p className="compass-card-label">This view · primary audience</p>
            <h3>You · Operator</h3>
            <p className="compass-eyebrow mb-4" style={{ letterSpacing: '0.08em' }}>
              Owner · Signing authority · Sees every figure
            </p>
            <p className="compass-body text-[14.5px]">
              <span className="text-white font-semibold">What you own:</span> P&amp;L,
              vendor relationships, the next hire, the board narrative.
              This view is the 30-second daily read on all of it.
            </p>
          </aside>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
          <div className="compass-kpi">
            <p className="compass-kpi-label">Recovered · network</p>
            <p className="compass-kpi-val">$<span>1.81</span><span className="unit">M</span></p>
          </div>
          <div className="compass-kpi">
            <p className="compass-kpi-label">Orders reconciled</p>
            <p className="compass-kpi-val">545<span className="unit">,677</span></p>
          </div>
          <div className="compass-kpi">
            <p className="compass-kpi-label">Free to try</p>
            <p className="compass-kpi-val">7<span className="unit">/24</span></p>
          </div>
          <div className="compass-kpi">
            <p className="compass-kpi-label">Self-onboard</p>
            <p className="compass-kpi-val">15<span className="unit">min</span></p>
          </div>
        </div>
      </section>

      {/* § 01 · THE STORY */}
      <section id="who" className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
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
              The rule that runs the company: <span className="text-white font-semibold">when our model is wrong, we publish the correction.</span> The first time it happened we walked an $8.3M number down to $1.81M, in writing, to the design partner who&apos;d already seen the original figure. That&apos;s why they stayed. <Link href="/case/walked-the-number-back" className="underline" style={{ textDecorationColor: '#0066ff' }}>Read the case.</Link>
            </p>
            <p>
              Today we serve the whole ladder — <span className="text-white font-semibold">solo operator on one Toast terminal, all the way to a CEO running 50 stores across three brands.</span> Same source-tag discipline. Same operator-first ethos. The price scales; the rule doesn&apos;t.
            </p>
          </div>
        </div>
      </section>

      {/* § 02 · WHAT WE OFFER — independent → enterprise */}
      <section id="offer-tiers" className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="compass-eyebrow mb-4">— 02 · What we offer</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-14">
            From the solo operator <em>to the C-suite.</em>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            <div className="compass-card flex flex-col">
              <p className="compass-card-label">— Independent</p>
              <h3>One store. One operator.</h3>
              <p className="compass-body text-[14px] mt-3 mb-5">
                You&apos;re running ops, finance, marketing, HR, and the floor yourself at 11pm. The free trial is built for you.
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>60-minute timed trial · drop a CSV · no card</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>All 7 CSV agents to try (Void Hunter · Leak Detector · Labor Drift · Tip Variance · Catering Leak · BCS · Vendor Drift)</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>Direct line to the founder</span></li>
              </ul>
              <Link href="/trial" onClick={() => trackEvent('home_audience_cta_click', { meta: { tier: 'independent', target: '/trial', label: 'Start the trial' } })} className="btn-secondary mt-auto" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff', border: '1px solid #2c2c2e' }}>
                Start the trial
              </Link>
            </div>

            <div className="compass-card flex flex-col" style={{ borderColor: '#0066ff' }}>
              <p className="compass-card-label" style={{ color: '#0066ff' }}>— Operator · $299/mo</p>
              <h3>1–3 stores.</h3>
              <p className="compass-body text-[14px] mt-3 mb-5">
                The full agent stack wired to your live POS. Daily auto-pull, per-name alerts, your Command Center.
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#0066ff' }}>✓</span><span>All agents wired to Toast / Square / Clover</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#0066ff' }}>✓</span><span>Email + SMS alerts when a name spikes</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#0066ff' }}>✓</span><span>Single-tenant Command Center · 90-day history</span></li>
              </ul>
              <Link href="/onboard" onClick={() => trackEvent('home_audience_cta_click', { meta: { tier: 'operator', target: '/onboard', label: 'Onboard your store' } })} className="btn-primary mt-auto" style={{ background: '#0066ff' }}>
                Onboard your store →
              </Link>
            </div>

            <div className="compass-card flex flex-col">
              <p className="compass-card-label">— Multi-unit · $999/mo</p>
              <h3>4–16 stores.</h3>
              <p className="compass-body text-[14px] mt-3 mb-5">
                Network-level peer bands. Per-role lenses for CFO, COO, Chef, GM. Roll-up + drill-down.
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>Peer-band analysis across your fleet</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>Per-role lenses · CEO · CFO · COO · Chef · Owner</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>Slack + Teams integration · unlimited history</span></li>
              </ul>
              <Link href="/onboard" onClick={() => trackEvent('home_audience_cta_click', { meta: { tier: 'multi_unit', target: '/onboard', label: 'Talk to us' } })} className="btn-secondary mt-auto" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff', border: '1px solid #2c2c2e' }}>
                Talk to us
              </Link>
            </div>

            <div className="compass-card flex flex-col">
              <p className="compass-card-label">— Enterprise · Custom</p>
              <h3>16+ stores. Multi-brand.</h3>
              <p className="compass-body text-[14px] mt-3 mb-5">
                Per-brand isolation. SSO. Custom POS integrations (Aloha, PDQ, proprietary). MCP API. QBR.
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>Per-brand tenant isolation</span></li>
                <li className="compass-body text-[13px] flex gap-2"><span style={{ color: '#34c759' }}>✓</span><span>SSO · Okta / Azure AD / Google</span></li>
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
      <section id="myke" className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
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
      <section id="what" className="border-t border-[#1f1f1f] py-20 md:py-28 px-6 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="max-w-7xl mx-auto">
          <p className="compass-eyebrow mb-4">— 04 · What we do</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-14">
            We sit on top of your POS<br />
            and tell you <em>when one of them is lying.</em>
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
                Seven agents reading sales, labor, voids, 3P fees, tips, catering, shift sentiment. One screen per role. Every figure source-tagged <span style={{ color: '#34c759' }} className="font-semibold">Verified</span> / <span style={{ color: '#ff9500' }} className="font-semibold">Estimated</span> / <span style={{ color: '#ff453a' }} className="font-semibold">Unverified</span>. When we&apos;re wrong, we publish the correction.
              </p>
            </div>
            <div className="compass-card">
              <p className="compass-card-label">— How it works</p>
              <h3>30 seconds to first leak.</h3>
              <p className="compass-body text-[15px] mt-3 leading-relaxed">
                Drop a Toast / Square / Clover / PDQ export at <Link href="/trial" className="underline text-white" style={{ textDecorationColor: '#0066ff' }}>/trial</Link>. Void Hunter and the Leak Detector run on your real numbers. 60-minute live read, no card, no human in the loop. If you like it, wire it to live data — we email per-POS when each OAuth ships.
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
      <section id="agents" className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
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
      <section id="seats" className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="compass-eyebrow mb-4">— 06 · Pick your seat</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-12">
            One platform. <em>Seven roles.</em>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {SEATS.slice(1).map((s) => (
              <Link key={s.name} href={s.href} className="compass-card hover:border-[#0066ff] transition-colors text-center block">
                <p className="compass-card-label">{s.tag}</p>
                <p className="font-serif text-2xl md:text-3xl mt-2 text-white">{s.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Talk to us */}
      <section id="offer" className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
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
            <Link href="/for"     className="hover:text-white transition-colors">Seats</Link>
            <Link href="/people"  className="hover:text-white transition-colors">People</Link>
            <Link href="/onboard" className="hover:text-white transition-colors">Onboard</Link>
            <Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link>
            <Link href="/reports/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
