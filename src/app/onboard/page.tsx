'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/track';

const POS_OPTIONS = ['PDQ', 'Toast', 'Square', 'Clover', 'Aloha', 'PAR / Brink', 'Simphony', 'Lightspeed', 'Other / not sure'];
const FREE_PRODUCT = 'Action Shift';

const DATA_OPTIONS = [
  { v: 'Forward the daily close email', d: 'Use the report already arriving after close. No POS API key needed to start.' },
  { v: 'Upload yesterday\'s reports',   d: 'Send the POS close, labor, invoice, or marketplace file you already have.' },
  { v: 'Connect a read-only inbox',     d: 'Let Never 86\'d collect only the approved report and invoice messages.' },
  { v: 'Talk to us first',         d: '15 minutes. We figure out together what makes sense for your setup.' },
];

type Status = 'idle' | 'loading' | 'success' | 'error';

const inputClass = "w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors";

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [units, setUnits] = useState('');
  const [posType, setPosType] = useState('');
  const [dataPreference, setDataPreference] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => { trackEvent('onboard_view'); }, []);

  const step1Valid = name.trim() && email.trim() && restaurantName.trim();
  const step2Valid = !!posType;
  const step3Valid = !!dataPreference;
  const interestedAgent = FREE_PRODUCT;

  async function handleSubmit() {
    trackEvent('onboard_submit', { meta: { posType, interestedAgent, dataPreference, units: units || null } });
    setStatus('loading');
    try {
      // Monday gate: mint activation token (password never emailed). Keep waitlist
      // mirror as a soft backup so Myke still sees the lead if ops DB is down.
      const res = await fetch('/api/onboard/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          restaurantName,
          sourcePage: '/onboard',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(
          data.debugActivatePath
            ? `${data.message} Dev link: ${data.debugActivatePath}`
            : data.message || 'Check your email for the activation link.',
        );
        setStep(4);
        trackEvent('onboard_submit_success', { meta: { posType, interestedAgent, dataPreference, path: 'activation' } });
        return;
      }

      // If activation DB is offline, fall back to waitlist so the form never dead-ends.
      if (res.status === 503) {
        const wait = await fetch('/api/waitlist', {
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
        const waitData = await wait.json();
        if (waitData.success) {
          setStatus('success');
          setMessage(
            "You're on the list. Free-seat tables still need a Neon push (drizzle/0002_free_seat_neon.sql). Supabase can wait until morning.",
          );
          setStep(4);
          trackEvent('onboard_submit_success', { meta: { posType, interestedAgent, dataPreference, path: 'waitlist_fallback' } });
          return;
        }
      }

      throw new Error(data.error || 'Something went wrong');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setStatus('error');
      setMessage(msg);
      trackEvent('onboard_submit_error', { meta: { posType, interestedAgent, dataPreference, error: msg } });
    }
  }

  const pickClass = (selected: boolean) =>
    `compass-card text-left transition-all cursor-pointer ${selected ? '!border-[#0066ff]' : 'hover:border-[#d2d2d7]'}`;

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86&apos;d <span className="italic text-ink-600">· onboard</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Set yourself up · 3 quick steps</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/" className="compass-pill"><span className="avatar">H</span><span>Home</span></Link>
          </nav>
        </div>
      </div>

      <section className="pt-16 md:pt-20 pb-10 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="compass-eyebrow mb-5">— Step {Math.min(step, 3)} of 3</p>
          <div className="flex justify-center gap-1.5 mb-12" aria-hidden>
            {[1, 2, 3].map((n) => (
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
              <p className="compass-body text-lg mb-4">Three things. Takes ten seconds.</p>
              <p className="compass-eyebrow mb-10" style={{ color: '#0066ff' }}>One store · one login · free founding beta</p>
              <form
                onSubmit={(e) => { e.preventDefault(); if (step1Valid) { trackEvent('onboard_step_1_complete', { meta: { hasUnits: !!units } }); setStep(2); } }}
                className="compass-card text-left space-y-3"
              >
                <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                <input type="text" placeholder="Restaurant or group" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} required className={inputClass} />
                <input type="number" inputMode="numeric" min="1" placeholder="Locations (free includes 1)" value={units} onChange={(e) => setUnits(e.target.value)} className={inputClass} />
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
              <p className="compass-body text-lg mb-10">So we know what you&apos;re running.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {POS_OPTIONS.map((opt) => (
                  <button key={opt} type="button" onClick={() => { if (opt !== posType) trackEvent('onboard_pos_selected', { meta: { posType: opt } }); setPosType(opt); }} className={pickClass(posType === opt)}>
                    <p className="font-serif text-xl text-ink-800 tracking-tight">{opt}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8 gap-3">
                <button type="button" onClick={() => { trackEvent('onboard_back', { meta: { fromStep: 2 } }); setStep(1); }} className="btn-secondary" style={{ background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f' }}>← Back</button>
                <button type="button" onClick={() => { if (step2Valid) { trackEvent('onboard_step_2_complete', { meta: { posType } }); setStep(3); } }} disabled={!step2Valid} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: '#0066ff' }}>Next →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="compass-display text-4xl md:text-6xl mb-4">
                How does yesterday&apos;s close <em>arrive?</em>
              </h1>
              <p className="compass-body text-lg mb-3">Action Shift is already selected. Pick the data path that fits today.</p>
              <p className="compass-eyebrow mb-10" style={{ color: '#0066ff' }}>Morning action · night proof</p>
              <div className="grid gap-3">
                {DATA_OPTIONS.map((d) => (
                  <button key={d.v} type="button" onClick={() => { if (d.v !== dataPreference) trackEvent('onboard_data_pref_selected', { meta: { dataPreference: d.v } }); setDataPreference(d.v); }} className={pickClass(dataPreference === d.v)}>
                    <p className="font-serif text-xl text-ink-800 tracking-tight mb-1">{d.v}</p>
                    <p className="compass-body text-sm leading-snug">{d.d}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8 gap-3">
                <button type="button" onClick={() => { trackEvent('onboard_back', { meta: { fromStep: 3 } }); setStep(2); }} className="btn-secondary" style={{ background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f' }}>← Back</button>
                <button type="button" onClick={handleSubmit} disabled={!step3Valid || status === 'loading'} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: '#0066ff' }}>
                  {status === 'loading' ? 'Sending…' : 'Start my free store →'}
                </button>
              </div>
              {status === 'error' && <p className="text-[#ff453a] text-sm text-center mt-4">{message}</p>}
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="compass-eyebrow mb-5" style={{ color: '#34c759' }}>— You&apos;re in</p>
              <h1 className="compass-display text-4xl md:text-6xl mb-5">
                <em>Welcome.</em>
              </h1>
              <p className="compass-body text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10">
                Your free one-store <span className="text-ink-800 font-semibold">{interestedAgent}</span> setup is queued for{' '}
                <span className="text-ink-800 font-semibold">{restaurantName}</span>.
                Start with one operator login. Myke will reach out from <span className="font-mono text-ink-800">myke@n86.app</span> within 24 hours.
              </p>

              <div className="compass-card text-left mb-8">
                <p className="compass-card-label">What you told us</p>
                <ul className="space-y-2 mt-3" style={{ color: '#515154' }}>
                  <li><span style={{ color: '#6e6e73' }}>Restaurant ·</span> {restaurantName}{units ? ` (${units} units)` : ''}</li>
                  <li><span style={{ color: '#6e6e73' }}>POS ·</span> {posType}</li>
                  <li><span style={{ color: '#6e6e73' }}>Checking ·</span> {interestedAgent}</li>
                  <li><span style={{ color: '#6e6e73' }}>Data path ·</span> {dataPreference}</li>
                </ul>
              </div>

              <p className="compass-body text-lg mb-6">Want to skip the wait? Grab a 15-minute slot now.</p>
              <a
                href="https://outlook.office.com/bookwithme/user/fe6663123f354f7da6e4bb9d76d223eb@n86.app?anonymous&ismsaljsauthenabled"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('onboard_book_meeting_click', { meta: { interestedAgent, posType } })}
                className="btn-primary"
                style={{ background: '#0066ff' }}
              >
                Book 15 minutes →
              </a>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[#e8e8ed] py-10 px-6 mt-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <Link href="/" className="hover:text-ink-800 transition-colors">Home</Link>
        </div>
      </footer>
    </main>
  );
}
