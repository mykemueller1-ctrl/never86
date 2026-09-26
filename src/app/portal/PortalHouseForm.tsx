'use client';

import { useState } from 'react';

export function PortalHouseForm() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setOk(null);
    const response = await fetch('/api/portal/house', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const body = (await response.json()) as { ok?: boolean; hint?: string; error?: string };
    setOk(body.ok === true);
    setMessage(body.hint ?? body.error ?? 'No seat opened.');
  }

  return (
    <form onSubmit={onSubmit} className="owner-portal-form">
      <label>
        <span>House code</span>
        <input
          type="text"
          name="code"
          autoComplete="off"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Store house code"
        />
      </label>
      <p className="owner-portal-note">Store code only. Not your password.</p>
      <button type="submit">Open the seat →</button>
      {message ? (
        <p className="owner-desk-poetry" style={{ color: ok ? '#166534' : '#526175' }}>
          {message}
        </p>
      ) : null}
    </form>
  );
}

export function PortalHouseDisclosure() {
  const [open, setOpen] = useState(false);
  return (
    <div className="owner-portal-code">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        Have a store house code?
      </button>
      {open ? (
        <>
          <p className="owner-portal-note">
            This opens one store. It is not your password. The free owner seat still starts by email.
          </p>
          <PortalHouseForm />
        </>
      ) : null}
    </div>
  );
}
