import UnifiedCommandCenter from '@/components/UnifiedCommandCenter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: "Command Center | Never 86'd" };

// Consolidated: all five role lenses (CEO · CFO · COO · CTO · Data) render in
// a single long-scroll screen with anchor nav. Operator id hardcoded to 3
// until per-user auth lands; name flows from operator_users.restaurant_name.
export default function CommandCenterPage() {
  return <UnifiedCommandCenter operatorId={3} />;
}
