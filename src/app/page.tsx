'use client';

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

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
        setMessage(data.message || "You're on the list!");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong');
    }
  }

  return (
    <main className="min-h-screen bg-dark-800 flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <h1 className="text-5xl md:text-7xl font-bold text-gold-500 mb-4 tracking-tight">
          Never 86'd
        </h1>
        <p className="text-dark-200 text-lg md:text-xl mb-2">
          Restaurant ops, finally fixed.
        </p>
        <p className="text-dark-300 text-base md:text-lg mb-12 max-w-lg mx-auto">
          Invoice OCR. Z-Report processing. Morning briefings with your real numbers —
          before you walk in the door. Built by an operator, for operators.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 text-left">
          <div className="bg-dark-700 rounded-xl p-6 border border-dark-600">
            <div className="text-gold-500 text-2xl mb-3">📄</div>
            <h3 className="text-white font-semibold mb-2">Invoice OCR</h3>
            <p className="text-dark-300 text-sm">
              Email or upload your invoices. AI reads every line item — vendor, quantity, price, category. No manual entry.
            </p>
          </div>
          <div className="bg-dark-700 rounded-xl p-6 border border-dark-600">
            <div className="text-gold-500 text-2xl mb-3">📊</div>
            <h3 className="text-white font-semibold mb-2">Z-Report Processing</h3>
            <p className="text-dark-300 text-sm">
              Drop your end-of-day report. Get food cost %, liquor cost %, prime cost %, check average — calculated automatically.
            </p>
          </div>
          <div className="bg-dark-700 rounded-xl p-6 border border-dark-600">
            <div className="text-gold-500 text-2xl mb-3">☀️</div>
            <h3 className="text-white font-semibold mb-2">Morning Briefing</h3>
            <p className="text-dark-300 text-sm">
              6 AM email with yesterday's numbers, week-to-date trends, and flags if anything's off-target. Know before you walk in.
            </p>
          </div>
        </div>

        {/* Waitlist Form */}
        {status === 'success' ? (
          <div className="bg-dark-700 rounded-xl p-8 border border-gold-700">
            <p className="text-gold-500 text-xl font-semibold mb-2">{message}</p>
            <p className="text-dark-300">Check your email — we sent you a welcome note.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-gold-500 transition-colors"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-gold-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Restaurant name (optional)"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-gold-500 transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-gold-500 hover:bg-gold-600 text-dark-900 font-semibold rounded-lg px-4 py-3 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Joining...' : 'Join the Waitlist'}
            </button>
            {status === 'error' && (
              <p className="text-red-400 text-sm">{message}</p>
            )}
          </form>
        )}

        {/* Footer */}
        <p className="text-dark-400 text-xs mt-16">
          Never 86'd · Built by an operator, for operators · never86.ai
        </p>
      </div>
    </main>
  );
}
