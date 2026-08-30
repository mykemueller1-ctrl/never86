import { CommandCenterSwarmDashboard } from '@/components/CommandCenterSwarmDashboard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = {
  title: "Command Center Swarm | Never 86'd",
  robots: { index: false, follow: false },
};

/** Same sample dashboard; this path stays behind the existing reports gate. */
export default function CommandCenterSwarmPage() {
  return <CommandCenterSwarmDashboard />;
}
