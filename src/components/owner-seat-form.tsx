'use client';

import { useState } from 'react';

type OwnerSeatFormProps = {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
};

export function OwnerSeatForm({
  title = 'Claim your free owner seat',
  subtitle = 'One location and the owner seat are free. Add paid seats later when your team is ready.',
  buttonLabel = 'Claim free owner seat',
}: OwnerSeatFormProps) {
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
        body: JSON.stringify({
          email,
          name,
          restaurantName,
          role: 'owner',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      setMessage(data.message || 'Your owner seat is reserved.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-gold-700 bg-dark-700 p-8 text-left shadow-xl shadow-black/20">
        <p className="mb-2 text-xl font-semibold text-gold-500">{message}</p>
        <p className="text-sm text-dark-300">
          Check your email for the welcome note and next step for your free owner seat.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dark-600 bg-dark-700 p-8 text-left shadow-xl shadow-black/20">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-dark-300">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Owner name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-dark-600 bg-dark-800 px-4 py-3 text-white placeholder-dark-400 focus:border-gold-500 focus:outline-none transition-colors"
        />
        <input
          type="email"
          placeholder="Owner email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-dark-600 bg-dark-800 px-4 py-3 text-white placeholder-dark-400 focus:border-gold-500 focus:outline-none transition-colors"
        />
        <input
          type="text"
          placeholder="Restaurant or hospitality group"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          className="w-full rounded-lg border border-dark-600 bg-dark-800 px-4 py-3 text-white placeholder-dark-400 focus:border-gold-500 focus:outline-none transition-colors"
        />

        <div className="rounded-lg border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-dark-200">
          <p className="font-medium text-white">Seat policy</p>
          <p className="mt-1">
            Seat 1 is the owner and it is free for one location. Seats 2 and 3 become paid seats
            when you add more people.
          </p>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-lg bg-gold-500 px-4 py-3 font-semibold text-dark-900 transition-colors hover:bg-gold-600 disabled:opacity-50"
        >
          {status === 'loading' ? 'Saving your seat...' : buttonLabel}
        </button>

        {status === 'error' && <p className="text-sm text-red-400">{message}</p>}
      </form>
    </div>
  );
}
