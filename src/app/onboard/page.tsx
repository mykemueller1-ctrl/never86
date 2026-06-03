'use client';

import Link from 'next/link';
import { useState } from 'react';

const POS_OPTIONS = ['Toast', 'Square', 'Clover', 'Aloha', 'Lightspeed', 'Other / not sure'];

const AGENT_OPTIONS = [
  { v: 'Void Hunter', d: 'Catch the void pattern before it eats the night.' },
  { v: '3P Fee Finder', d: 'See what DoorDash, UberEats, GrubHub are actually keeping.' },
  { v: 'Labor Leak', d: 'Find the labor that ran without permission.' },
  { v: 'Tip Variance', d: 'Spot the tip drift that nobody talks about.' },
  { v: 'Catering Leak', d: 'Off-menu catering with no margin discipline.' },
  { v: 'Rate Card Audit', d: 'Where your 3P contracted rate sits vs the peer band.' },
  { v: 'Shift Pulse', d: 'Crew + manager sentiment at the close of every shift.' },
  { v: 'All of the above', d: 'Wire the whole stack — Command Center on your data.' },
];

const DATA_OPTIONS = [
  { v: 'Toast IQ wiring', d: 'You give us read-only Toast IQ — we pull what we need, you see every figure.' },
  { v: 'CSV upload', d: 'Drop a sales + labor export. We run the agent and send the read-back.' },
  { v: 'Looker / email forwarding', d: 'Forward your daily rollup. We tag every number we use.' },
  { v: 'Talk to us first', d: '15 minutes. We decide together what makes sense for your stack.' },
];

type Status = 'idle' | 'loading' | 'success' | 'error';

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

      <section className="pt-20 md:pt-28 pb-10 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 mb-5">
            Step {Math.min(step, 4)} of 4
          </p>
          <div className="flex justify-center gap-1.5 mb-10" aria-hidden>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-1 w-12 rounded-full transition-colors ${
                  step >= n ? 'bg-ink-800' : 'bg-ink-200'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div>
              <h1 className="display text-4xl md:text-6xl mb-4">Who are you?</h1>
              <p className="text-ink-600 text-lg mb-10">Three things. Takes ten seconds.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step1Valid) setStep(2);
                }}
                className="card p-7 space-y-3 text-left"
              >
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Restaurant or group"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                  className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Units (optional)"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!step1Valid}
                  className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="display text-4xl md:text-6xl mb-4">Your POS?</h1>
              <p className="text-ink-600 text-lg mb-10">So we know what we&apos;re wiring into.</p>
              <div className="grid sm:grid-cols-2 gap-3 text-left">
                {POS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPosType(opt)}
                    className={`card p-5 text-left transition-all ${
                      posType === opt
                        ? 'border-ink-800 ring-2 ring-ink-800/10'
                        : 'hover:-translate-y-0.5'
                    }`}
                  >
                    <p className="font-semibold text-ink-800 text-lg tracking-tighter">{opt}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8 gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
                <button
                  onClick={() => step2Valid && setStep(3)}
                  disabled={!step2Valid}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="display text-4xl md:text-6xl mb-4">Which agent first?</h1>
              <p className="text-ink-600 text-lg mb-10">Pick one. You can have the rest later.</p>
              <div className="grid sm:grid-cols-2 gap-3 text-left">
                {AGENT_OPTIONS.map((a) => (
                  <button
                    key={a.v}
                    type="button"
                    onClick={() => setInterestedAgent(a.v)}
                    className={`card p-5 text-left transition-all ${
                      interestedAgent === a.v
                        ? 'border-ink-800 ring-2 ring-ink-800/10'
                        : 'hover:-translate-y-0.5'
                    }`}
                  >
                    <p className="font-semibold text-ink-800 text-lg tracking-tighter mb-1">{a.v}</p>
                    <p className="text-ink-600 text-sm leading-snug">{a.d}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8 gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary">← Back</button>
                <button
                  onClick={() => step3Valid && setStep(4)}
                  disabled={!step3Valid}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 className="display text-4xl md:text-6xl mb-4">How do you want to share data?</h1>
              <p className="text-ink-600 text-lg mb-10">Pick the path that fits where you are today.</p>
              <div className="grid gap-3 text-left">
                {DATA_OPTIONS.map((d) => (
                  <button
                    key={d.v}
                    type="button"
                    onClick={() => setDataPreference(d.v)}
                    className={`card p-5 text-left transition-all ${
                      dataPreference === d.v
                        ? 'border-ink-800 ring-2 ring-ink-800/10'
                        : 'hover:-translate-y-0.5'
                    }`}
                  >
                    <p className="font-semibold text-ink-800 text-lg tracking-tighter mb-1">{d.v}</p>
                    <p className="text-ink-600 text-sm leading-snug">{d.d}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8 gap-3">
                <button onClick={() => setStep(3)} className="btn-secondary">← Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={!step4Valid || status === 'loading'}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? 'Sending…' : 'Finish →'}
                </button>
              </div>
              {status === 'error' && (
                <p className="text-danger-500 text-sm text-center mt-4">{message}</p>
              )}
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-success-500 mb-5">You&apos;re in</p>
              <h1 className="display text-4xl md:text-6xl mb-5">Welcome.</h1>
              <p className="text-ink-600 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10">
                <strong className="text-ink-800">{interestedAgent}</strong> is queued for{' '}
                <strong className="text-ink-800">{restaurantName}</strong>.
                Myke will reach out from <span className="font-mono">myke@n86.app</span> within 24 hours.
              </p>

              <div className="card p-7 text-left mb-8">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 mb-4">What you told us</p>
                <ul className="space-y-2 text-ink-700">
                  <li><span className="text-ink-500">Restaurant ·</span> {restaurantName}{units ? ` (${units} units)` : ''}</li>
                  <li><span className="text-ink-500">POS ·</span> {posType}</li>
                  <li><span className="text-ink-500">Agent ·</span> {interestedAgent}</li>
                  <li><span className="text-ink-500">Data path ·</span> {dataPreference}</li>
                </ul>
              </div>

              <p className="text-ink-600 text-lg mb-6">Want to skip the wait? Grab a 15-minute slot now.</p>
              <a
                href="https://outlook.office.com/bookwithme/user/fe6663123f354f7da6e4bb9d76d223eb@n86.app?anonymous&ismsaljsauthenabled"
                target="_blank"
                rel="noopener"
                className="btn-primary"
              >
                Book 15 minutes →
              </a>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-ink-200 py-10 px-6 bg-white mt-10">
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
