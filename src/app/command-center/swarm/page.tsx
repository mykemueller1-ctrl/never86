import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: "Command Center Swarm (archived) | Never 86'd",
  robots: { index: false, follow: false },
};

/** Duplicate swarm route archived. Sample runner lives at /action-shift/swarm. Seat door is /portal. */
export default function CommandCenterSwarmArchivedPage() {
  redirect('/action-shift/swarm');
}
