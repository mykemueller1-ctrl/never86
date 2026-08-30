import Link from 'next/link';
import { runSampleCommandCenterSwarm } from '@/lib/commandCenterSwarm';

function usd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function CommandCenterSwarmDashboard() {
  const report = runSampleCommandCenterSwarm();
  const shift = report.actionShift;
  const top = shift?.morningActions[0];

  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-[15px]">Never 86&apos;d</span>
            <span className="text-ink-500 text-[12px] font-medium">· Swarm</span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px] text-ink-600">
            <Link href="/action-shift" className="px-3 py-1.5 rounded-full hover:bg-black/[0.04]">Action Shift</Link>
            <Link href="/agents" className="px-3 py-1.5 rounded-full hover:bg-black/[0.04]">Agents</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-12 pb-16">
        <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-2">
          {report.store.name} · {report.store.businessDate} · Operator System {report.operatorSystem}
        </p>
        <h1 className="display text-4xl md:text-6xl mb-3">Specialist swarm.</h1>
        <p className="text-ink-600 max-w-2xl mb-10">
          CSV-first workers. No portal login. {report.sendsDelivered} sends delivered.
          Human approval still required before any external message. Sample store only.
        </p>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="card p-5">
            <p className="text-ink-500 text-xs uppercase tracking-wide mb-1">Free agents ran</p>
            <p className="text-2xl font-bold">{report.freeAgents.filter((a) => a.status === 'ran').length} / 10</p>
          </div>
          <div className="card p-5">
            <p className="text-ink-500 text-xs uppercase tracking-wide mb-1">Portal logins</p>
            <p className="text-2xl font-bold">{report.portalLogins}</p>
          </div>
          <div className="card p-5">
            <p className="text-ink-500 text-xs uppercase tracking-wide mb-1">Sends delivered</p>
            <p className="text-2xl font-bold">{report.sendsDelivered}</p>
          </div>
          <div className="card p-5">
            <p className="text-ink-500 text-xs uppercase tracking-wide mb-1">Pending approvals</p>
            <p className="text-2xl font-bold">{report.pendingApprovals.length}</p>
          </div>
        </section>

        <section className="mb-12">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-2">Action Shift</p>
          <h2 className="display text-3xl mb-4">One next move.</h2>
          {top && shift ? (
            <div className="card p-6 mb-4">
              <p className="text-[11px] uppercase tracking-wide text-ink-500 mb-2">
                {top.id} · {top.sourceStatus} · owner {top.owner}
              </p>
              <h3 className="text-xl font-semibold mb-2">{top.title}</h3>
              <p className="text-ink-600 text-sm mb-3">{top.evidence}</p>
              <p className="text-ink-800 text-sm mb-3">{top.move}</p>
              <p className="text-ink-500 text-xs">{top.claimBoundary}</p>
              <p className="text-ink-800 font-semibold mt-4">{usd(top.dollarsObserved)} observed · verbal yes does not close</p>
            </div>
          ) : (
            <p className="text-ink-500">No Action Shift. {report.actionShiftError}</p>
          )}
          {shift ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-5">
                <p className="text-ink-500 text-xs uppercase tracking-wide mb-2">Night proof</p>
                <ul className="space-y-2 text-sm text-ink-700">
                  {shift.nightCloseCheck.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="card p-5">
                <p className="text-ink-500 text-xs uppercase tracking-wide mb-2">Missing evidence</p>
                <ul className="space-y-2 text-sm text-ink-700">
                  {shift.missingEvidence.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mb-12">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-2">Store team</p>
          <h2 className="display text-3xl mb-4">Specialists.</h2>
          <div className="space-y-2">
            {report.storeTeam.map((member) => (
              <div key={member.id} className="card p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-ink-500">{member.status} · {member.id}</p>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-ink-600 mt-1">{member.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-2">Free agents</p>
          <h2 className="display text-3xl mb-4">CSV-first workers.</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-ink-500">
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Agent</th>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Last run</th>
                  <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Rows</th>
                </tr>
              </thead>
              <tbody>
                {report.freeAgents.map((agent) => (
                  <tr key={agent.slug} className="border-b border-ink-200/60 last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-ink-800 font-medium">{agent.name}</p>
                      <p className="text-ink-500 text-xs mt-1">{agent.summary}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{agent.status}</td>
                    <td className="px-4 py-3 text-ink-600 tabular-nums">{agent.lastRunAt ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{agent.rowsParsed ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-2">Company</p>
          <h2 className="display text-3xl mb-4">Founder Chief of Staff routing.</h2>
          <div className="space-y-2">
            {report.companyRoutes.map((route) => (
              <div key={route.roleId + route.reason} className="card p-4">
                <p className="text-[11px] uppercase tracking-wide text-ink-500">
                  {route.departmentName} · store-private attached {String(route.storePrivateAttached)}
                </p>
                <p className="font-semibold">{route.roleName}</p>
                <p className="text-sm text-ink-600 mt-1">{route.reason} {route.nextAction}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-2">Approval inbox</p>
          <div className="space-y-2">
            {report.pendingApprovals.map((item, i) => (
              <div key={i} className="card p-4">
                <p className="text-[11px] uppercase tracking-wide text-ink-500">{item.kind} · {item.status}</p>
                <p className="text-sm text-ink-700 mt-1">{item.draft}</p>
                <p className="text-xs text-ink-500 mt-2">{item.note} Delivered: {String(item.delivered)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
