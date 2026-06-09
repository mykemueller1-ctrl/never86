'use client';

import Link from 'next/link';
import { useState } from 'react';

const POS_OPTIONS = ['Toast', 'Square', 'Clover', 'Aloha', 'Lightspeed', 'Other / not sure'];

const AGENT_OPTIONS = [
  { v: 'Void Hunter',     d: 'Catch the void pattern before it eats the night.' },
  { v: '3P Fee Finder',   d: 'See what DoorDash, UberEats, GrubHub are actually keeping.' },
  { v: 'Labor Leak',      d: 'Find the labor that ran without permission.' },
  { v: 'Tip Variance',    d: 'Spot the tip drift that nobody talks about.' },
  { v: 'Catering Leak',   d: 'Off-menu catering with no margin discipline.' },
  { v: 'Rate Card Audit', d: 'Where your 3P contracted rate sits vs the peer band.' },
  { v: 'Shift Pulse',     d: 'Crew + manager sentiment at the close of every shift.' },
  { v: 'All of the above',d: 'Wire the whole stack — Command Center on your data.' },
];

const DATA_OPTIONS = [
  { v: 'Toast IQ wiring',          d: 'You give us read-only Toast IQ — we pull what we need, you see every figure.' },
  { v: 'CSV upload',               d: 'Drop a sales + labor export. We run the agent and send the read-back.' },
  { v: 'Looker / email forwarding',d: 'Forward your daily rollup. We tag every number we use.' },
  { v: 'Talk to us first',         d: '15 minutes. We decide together what makes sense for your stack.' },
];

type Status = 'idle' | 'loading' | 'success' | 'error';

const inputClass = "w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors";

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [units, setUnits] = useState('');
  const [posType, setPosType] = useState('');
  const [interestedAgent, setInterestedAgent] = useState('');
  const [dataPreference, setDataPreference] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const step1Valid = name.trim() && email.trim() && restaurantName.trim();
  const step2Valid = !!posType;
  const step3Valid = !!interestedAgent;
  const step4Valid = !!dataPreference;

  async function handleSubmit() {
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          restaurantName,
          units: units || undefined,
          posType,
          interestedAgent,
          dataPreference,
          sourcePage: '/onboard',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message || "You're in.");
        setStep(5);
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  const pickClass = (selected: boolean) =>
    `compass-card text-left transition-all cursor-pointer ${selected ? '!border-[#0066ff]' : 'hover:border-[#2c2c2e]'}`;

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· onboard</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · self-serve · 4 steps</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/" className="compass-pill"><span className="avatar">H</span><span>Home</span></Link>
          </nav>
        </div>
      </div>

      <section className="pt-16 md:pt-20 pb-10 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="compass-eyebrow mb-5">— Step {Math.min(step, 4)} of 4</p>
          <div className="flex justify-center gap-1.5 mb-12" aria-hidden>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-1 w-12 rounded-full transition-colors"
                style={{ background: step >= n ? '#0066ff' : '#2c2c2e' }}
              />
            ))}
          </div>

          {step === 1 && (
            <div>
              <h1 className="compass-display text-4xl md:text-6xl mb-4">
                Who <em>are you?</em>
              </h1>
              <p className="compass-body text-lg mb-10">Three things. Takes ten seconds.</p>
              <form
                onSubmit={(e) => { e.preventDefault(); if (step1Valid) setStep(2); }}
                className="compass-card text-left space-y-3"
              >
                <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                <input type="text" placeholder="Restaurant or group" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} required className={inputClass} />
                <input type="number" inputMode="numeric" placeholder="Units (optional)" value={units} onChange={(e) => setUnits(e.target.value)} className={inputClass} />
                <button
                  type="submit"
                  disabled={!step1Valid}
                  className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#0066ff' }}
                >
                  Next →
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="compass-display text-4xl md:text-6xl mb-4">
                Your <em>POS?</em>
              </h1>
              <p className="compass-body text-lg mb-10">So we know what we&apos;re wiring into.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {POS_OPTIONS.map((opt) => (
                  <button key={opt} type="button" onClick={() => setPosType(opt)} className={pickClass(posType === opt)}>
                    <p className="font-serif text-xl text-white tracking-tight">{opt}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8 gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>← Back</button>
                <button onClick={() => step2Valid && setStep(3)} disabled={!step2Valid} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: '#0066ff' }}>Next →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="compass-display text-4xl md:text-6xl mb-4">
                Which agent <em>first?</em>
              </h1>
              <p className="compass-body text-lg mb-10">Pick one. You can have the rest later.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {AGENT_OPTIONS.map((a) => (
                  <button key={a.v} type="button" onClick={() => setInterestedAgent(a.v)} className={pickClass(interestedAgent === a.v)}>
                    <p className="font-serif text-xl text-white tracking-tight mb-1">{a.v}</p>
                    <p className="compass-body text-sm leading-snug">{a.d}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8 gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>← Back</button>
                <button onClick={() => step3Valid && setStep(4)} disabled={!step3Valid} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: '#0066ff' }}>Next →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 className="compass-display text-4xl md:text-6xl mb-4">
                How <em>share data?</em>
              </h1>
              <p className="compass-body text-lg mb-10">Pick the path that fits where you are today.</p>
              <div className="grid gap-3">
                {DATA_OPTIONS.map((d) => (
                  <button key={d.v} type="button" onClick={() => setDataPreference(d.v)} className={pickClass(dataPreference === d.v)}>
                    <p className="font-serif text-xl text-white tracking-tight mb-1">{d.v}</p>
                    <p className="compass-body text-sm leading-snug">{d.d}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8 gap-3">
                <button onClick={() => setStep(3)} className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>← Back</button>
                <button onClick={handleSubmit} disabled={!step4Valid || status === 'loading'} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: '#0066ff' }}>
                  {status === 'loading' ? 'Sending…' : 'Finish →'}
                </button>
              </div>
              {status === 'error' && <p className="text-[#ff453a] text-sm text-center mt-4">{message}</p>}
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="compass-eyebrow mb-5" style={{ color: '#34c759' }}>— You&apos;re in</p>
              <h1 className="compass-display text-4xl md:text-6xl mb-5">
                <em>Welcome.</em>
              </h1>
              <p className="compass-body text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10">
                <span className="text-white font-semibold">{interestedAgent}</span> is queued for{' '}
                <span className="text-white font-semibold">{restaurantName}</span>.
                Myke will reach out from <span className="font-mono text-white">myke@n86.app</span> within 24 hours.
              </p>

              <div className="compass-card text-left mb-8">
                <p className="compass-card-label">What you told us</p>
                <ul className="space-y-2 mt-3" style={{ color: '#c7c7cc' }}>
                  <li><span style={{ color: '#6e6e73' }}>Restaurant ·</span> {restaurantName}{units ? ` (${units} units)` : ''}</li>
                  <li><span style={{ color: '#6e6e73' }}>POS ·</span> {posType}</li>
                  <li><span style={{ color: '#6e6e73' }}>Agent ·</span> {interestedAgent}</li>
                  <li><span style={{ color: '#6e6e73' }}>Data path ·</span> {dataPreference}</li>
                </ul>
              </div>

              <p className="compass-body text-lg mb-6">Want to skip the wait? Grab a 15-minute slot now.</p>
              <a
                href="https://outlook.office.com/bookwithme/user/fe6663123f354f7da6e4bb9d76d223eb@n86.app?anonymous&ismsaljsauthenabled"
                target="_blank"
                rel="noopener"
                className="btn-primary"
                style={{ background: '#0066ff' }}
              >
                Book 15 minutes →
              </a>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[#1f1f1f] py-10 px-6 mt-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
        </div>
      </footer>
    </main>
  );
}
