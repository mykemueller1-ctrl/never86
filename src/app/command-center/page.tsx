import RoleView from '@/components/RoleView';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: "Command Center | Never 86'd" };

// CEO view (default). Operator id hardcoded to 3 until per-user auth lands;
// the name renders from operator_users.restaurant_name (scrubbed).
export default function CommandCenterPage() {
  return <RoleView operatorId={3} role="ceo" />;
}
