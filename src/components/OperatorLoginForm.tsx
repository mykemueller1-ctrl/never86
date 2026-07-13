'use client';

import { useState } from 'react';

type OperatorOption = { operatorId: number; name: string };

const inputClass =
  'w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors';

export default function OperatorLoginForm({ operators }: { operators: OperatorOption[] }) {
  const [operatorId, setOperatorId] = useState(operators[0]?.operatorId?.toString() ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/admin/operator-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorId: Number(operatorId), email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(`Login set for ${data.email} → operator ${data.operatorId}. They can sign in at /login.`);
        setEmail('');
        setPassword('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to save login.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="compass-card space-y-3">
      <label className="compass-card-label block">Operator</label>
      <select value={operatorId} onChange={(e) => setOperatorId(e.target.value)} className={inputClass}>
        {operators.map((o) => (
          <option key={o.operatorId} value={o.operatorId}>
            {o.name} (id {o.operatorId})
          </option>
        ))}
      </select>
      <input
        type="email"
        placeholder="Operator's login email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={inputClass}
      />
      <input
        type="text"
        placeholder="Starter password (8+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={status === 'loading' || !operatorId}
        className="btn-primary w-full disabled:opacity-50"
        style={{ background: '#0066ff' }}
      >
        {status === 'loading' ? 'Saving…' : 'Create / reset login'}
      </button>
      {status === 'success' && <p className="text-[#34c759] text-sm">{message}</p>}
      {status === 'error' && <p className="text-[#ff453a] text-sm">{message}</p>}
    </form>
  );
}
