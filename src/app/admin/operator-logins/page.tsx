import Link from 'next/link';
import { listReportableOperators } from '@/lib/toastReports';
import { opsDbConfigured } from '@/lib/opsDb';
import OperatorLoginForm from '@/components/OperatorLoginForm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = { title: "Operator logins | Never 86'd" };

// Admin-only (gated by middleware). Create or reset the login an operator uses
// at /login to reach their own /dashboard.
export default async function OperatorLoginsAdminPage() {
  let operators: { operatorId: number; name: string }[] = [];
  let connected = opsDbConfigured();
  if (connected) {
    try {
      const rows = await listReportableOperators();
      operators = rows.map((o) => ({ operatorId: o.operatorId, name: o.name }));
    } catch {
      connected = false;
    }
  }

  return (
    <main className="compass min-h-screen">
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-20">
        <Link href="/admin/never86" className="compass-eyebrow-dim">← Admin</Link>
        <p className="compass-eyebrow mb-3 mt-4">— Operator logins</p>
        <h1 className="compass-display text-4xl md:text-5xl mb-4">Give an operator their login.</h1>
        <p className="compass-body text-[15px] mb-8" style={{ color: '#86868b' }}>
          Pick the operator, set their email and a starter password. They sign in at{' '}
          <span className="font-mono text-white">/login</span> and land on their own command center —
          only their stores, nobody else&apos;s. Re-submitting the same email resets that password.
        </p>

        {!connected ? (
          <div className="compass-card">
            <p className="text-white font-semibold mb-1">Ops DB isn&apos;t connected.</p>
            <p className="compass-body text-[14px]" style={{ color: '#86868b' }}>
              Set <span className="font-mono">OPS_DATABASE_URL</span> and run{' '}
              <span className="font-mono">sql/0004_operator_auth.sql</span> first.
            </p>
          </div>
        ) : operators.length === 0 ? (
          <p className="compass-body" style={{ color: '#86868b' }}>No operators with data yet.</p>
        ) : (
          <OperatorLoginForm operators={operators} />
        )}
      </div>
    </main>
  );
}
