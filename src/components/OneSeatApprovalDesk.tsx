'use client';

import { useEffect, useState } from 'react';

type InboxRow = {
  id: string;
  status: string;
  provider: string;
  requestedAt: string;
  identityId: string;
};

export function OneSeatApprovalDesk() {
  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [approver, setApprover] = useState<'myke' | 'tom'>('myke');
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState('');

  async function load() {
    const res = await fetch('/api/staff/approvals');
    const data = await res.json();
    if (!data.success) {
      setBlocked(typeof data.error === 'string' ? data.error : 'Approvals fail closed.');
      setInbox([]);
      return;
    }
    setBlocked('');
    setInbox(Array.isArray(data.inbox) ? data.inbox : []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(id: string, decision: 'approve' | 'reject') {
    setError('');
    const res = await fetch(`/api/staff/approvals/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver, decision }),
    });
    const data = await res.json();
    if (!data.success) {
      setError(typeof data.error === 'string' ? data.error : 'Decision failed.');
      return;
    }
    await load();
  }

  if (blocked) {
    return <p className="compass-card text-[15px]" style={{ color: '#86868b' }}>{blocked}</p>;
  }

  return (
    <div className="space-y-4">
      <label className="block text-[13px]" style={{ color: '#6e6e73' }}>
        Approver
        <select
          value={approver}
          onChange={(e) => setApprover(e.target.value as 'myke' | 'tom')}
          className="mt-1 w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3"
        >
          <option value="myke">Myke</option>
          <option value="tom">Tom</option>
        </select>
      </label>
      {error ? <p className="text-[#ff453a] text-sm">{error}</p> : null}
      {inbox.length === 0 ? (
        <p className="compass-card text-[15px]" style={{ color: '#86868b' }}>No pending requests.</p>
      ) : inbox.map((row) => (
        <article key={row.id} className="compass-card space-y-3">
          <p className="text-[13px]" style={{ color: '#6e6e73' }}>
            {row.provider} · {row.requestedAt} · {row.identityId}
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn-primary" style={{ background: '#0066ff' }} onClick={() => void decide(row.id, 'approve')}>
              Match roster
            </button>
            <button type="button" className="btn-primary" style={{ background: '#1d1d1f' }} onClick={() => void decide(row.id, 'reject')}>
              Reject
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
