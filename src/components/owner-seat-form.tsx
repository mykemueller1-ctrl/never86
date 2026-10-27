'use client';

import { useState } from 'react';

type OwnerSeatFormProps = {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
};

export function OwnerSeatForm({
  title = 'Claim your free owner seat',
  subtitle = 'One location and the owner seat are free. Pricing for more seats and more units is TBD.',
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
      <div className="n86-card p-6 text-left">
        <p className="mb-2 text-xl font-semibold text-[#963c1c]">{message}</p>
        <p className="text-sm text-[#616b71]">
          Check your email for the welcome note and next step for your free owner seat.
        </p>
      </div>
    );
  }

  return (
    <div className="n86-card p-6 text-left">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-[-0.03em]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#616b71]">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Owner name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="n86-field placeholder:text-[#8a8478]"
        />
        <input
          type="email"
          placeholder="Owner email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="n86-field placeholder:text-[#8a8478]"
        />
        <input
          type="text"
          placeholder="Restaurant or hospitality group"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          className="n86-field placeholder:text-[#8a8478]"
        />

        <div className="rounded-lg border border-[#d8d5cd] bg-[#fafaf9] px-4 py-3 text-sm text-[#44403c]">
          <p className="font-medium text-[#25262a]">Seat policy</p>
          <p className="mt-1">
            Seat 1 is the owner and it is free for one location. Pricing for more seats and more
            units is TBD.
          </p>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="n86-btn-primary w-full disabled:opacity-50"
        >
          {status === 'loading' ? 'Saving your seat...' : buttonLabel}
        </button>

        {status === 'error' && <p className="text-sm text-red-400">{message}</p>}
      </form>
    </div>
  );
}
