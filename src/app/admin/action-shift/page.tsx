import Link from 'next/link';
import ActionShiftSetupDesk from '@/components/ActionShiftSetupDesk';

export const metadata = { title: "Action Shift setup | Never 86'd" };

export default function ActionShiftSetupPage() {
  return (
    <main className="min-h-screen bg-[#0c1210] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="flex flex-wrap gap-4 text-xs uppercase tracking-wider text-white/45">
          <Link href="/admin/never86" className="hover:text-white">← Admin</Link>
          <Link href="/admin/operator-logins" className="hover:text-white">Operator logins</Link>
          <Link href="/action-shift" className="hover:text-white">Action Shift desk</Link>
          <Link href="/action-shift/manager" className="hover:text-white">Manager seat</Link>
        </nav>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-amber-200">Community launch desk</p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">Roster, schedule, roles, and checklists—with every mismatch visible.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">Use the provider&apos;s immutable worker and shift IDs. Names are display-only and are never used to guess a match. This prepares the private deployment packet without putting employee data in Git or an inactive database.</p>
        <div className="mt-10"><ActionShiftSetupDesk /></div>
      </div>
    </main>
  );
}
