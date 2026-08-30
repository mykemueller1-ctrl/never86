import { CommandCenterSwarmDashboard } from '@/components/CommandCenterSwarmDashboard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = {
  title: "Command Center Swarm | Never 86'd",
  robots: { index: false, follow: false },
};

/** Sample-store swarm status. No portal login. Noindex. */
export default function ActionShiftSwarmPage() {
  return <CommandCenterSwarmDashboard />;
}
