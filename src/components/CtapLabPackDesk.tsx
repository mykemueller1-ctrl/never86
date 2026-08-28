import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  CTAP_COGS_BONUS_POLICY,
  CTAP_LAB_PACK_STATUS,
  CTAP_LAB_STATION_SEATS,
  CTAP_LAB_TEMPLATES,
  CTAP_VENDOR_CADENCE_RULES,
} from '@/lib/ctapLabPack';

const SEAT_ORDER = ['owner', 'foh_manager', 'kitchen_manager', 'bartender', 'server', 'prep', 'driver'] as const;

export function CtapLabPackDesk() {
  const seats = SEAT_ORDER.map((seatKey) =>
    CTAP_LAB_STATION_SEATS.find((seat) => seat.seatKey === seatKey),
  ).filter((seat): seat is (typeof CTAP_LAB_STATION_SEATS)[number] => Boolean(seat));

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0c1210',
        color: '#e8efe9',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 20px 64px' }}>
        <p style={{ color: '#9db0a3', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12 }}>
          Community Tap lab · templates only · {CTAP_LAB_PACK_STATUS}
        </p>
        <h1 style={{ fontSize: 32, margin: '8px 0 10px' }}>Station checklists from the wall docs</h1>
        <p style={{ color: '#c5d4c9', lineHeight: 1.55, maxWidth: 720 }}>
          Seeded from manager-expectations, waitstaff Mon–Sun, bar open/close, kitchen open/close, and driver
          between-runs dishes. These are station seats, not live payroll. Vendor cadence is schedule rules, not live
          POs. COGS bands are policy constants, not this week&apos;s dollars. No invented current-week sales. No
          evidence-master narrative.
        </p>
        <p style={{ color: '#8fa196', fontSize: 13 }}>
          Public-safe pack: no personal emails, phone numbers, PINs, passwords, SSNs, or home addresses.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '18px 0 28px' }}>
          <Link href="/action-shift" style={chip()}>
            Action Shift
          </Link>
          <Link href="/action-shift/manager" style={chip()}>
            Manager seat
          </Link>
          <Link href="/action-shift/setup" style={chip()}>
            Payroll join
          </Link>
          <Link href="/dashboard/setup" style={chip()}>
            Setup
          </Link>
          <Link href="/admin/action-shift" style={chip()}>
            Admin Action Shift
          </Link>
        </div>

        <section style={card()}>
          <h2 style={h2()}>Station seats</h2>
          <p style={{ color: '#9db0a3', fontSize: 14 }}>
            Owner; FOH Manager stations (bar side / pizza side); Kitchen Manager station; bartender, server, prep,
            driver checklists.
          </p>
          <ul style={{ paddingLeft: 18, color: '#d7e3db' }}>
            {seats.map((seat) => (
              <li key={seat.seatKey} style={{ marginBottom: 8 }}>
                <strong>{seat.label}</strong> · {seat.roleKey}
                {seat.stations.length ? ` · stations: ${seat.stations.join(', ')}` : ''} — station seat, not payroll
              </li>
            ))}
          </ul>
        </section>

        <section style={card()}>
          <h2 style={h2()}>Vendor cadence (rules, not live POs)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ color: '#9db0a3', textAlign: 'left' }}>
                <th style={th()}>Day</th>
                <th style={th()}>Rule</th>
                <th style={th()}>Owner role</th>
              </tr>
            </thead>
            <tbody>
              {CTAP_VENDOR_CADENCE_RULES.map((rule) => (
                <tr key={`${rule.weekday}-${rule.action}-${rule.vendor}`}>
                  <td style={td()}>{rule.weekday}</td>
                  <td style={td()}>
                    {rule.action} {rule.vendor} ({rule.category.replace('_', '/')}) — {rule.note}
                  </td>
                  <td style={td()}>{rule.ownerRoleKey}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={card()}>
          <h2 style={h2()}>COGS bonus bands (policy constants)</h2>
          <p style={{ color: '#9db0a3', fontSize: 14 }}>
            Percent-of-category-sales targets only. Live weekly dollars stay out of Git.
          </p>
          <ul style={{ paddingLeft: 18 }}>
            {CTAP_COGS_BONUS_POLICY.map((band) => (
              <li key={band.category}>
                {band.category}: {band.targetMinPct}–{band.targetMaxPct}%
              </li>
            ))}
          </ul>
        </section>

        {seats.map((seat) => {
          const templates = CTAP_LAB_TEMPLATES.filter((template) => template.roleKey === seat.roleKey);
          return (
            <section key={seat.seatKey} style={card()}>
              <h2 style={h2()}>{seat.label} checklists</h2>
              {templates.map((template) => (
                <details key={template.id} style={{ marginBottom: 10 }}>
                  <summary style={{ cursor: 'pointer', color: '#7dffb3' }}>
                    {template.name} · {template.weekday ?? 'any day'} · {template.shiftPhase}
                  </summary>
                  <ol style={{ paddingLeft: 22, color: '#d7e3db' }}>
                    {template.steps.map((step) => (
                      <li key={`${template.id}-${step.instruction}`}>{step.instruction}</li>
                    ))}
                  </ol>
                </details>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function chip(): CSSProperties {
  return {
    border: '1px solid #2b4a3c',
    borderRadius: 999,
    padding: '8px 12px',
    color: '#7dffb3',
    textDecoration: 'none',
    fontSize: 13,
  };
}

function card(): CSSProperties {
  return {
    border: '1px solid #24332c',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    background: '#111916',
  };
}

function h2(): CSSProperties {
  return { fontSize: 18, margin: '0 0 8px' };
}

function th(): CSSProperties {
  return { padding: '6px 8px 10px 0', fontWeight: 600 };
}

function td(): CSSProperties {
  return { padding: '6px 8px 6px 0', borderTop: '1px solid #24332c', verticalAlign: 'top' };
}
