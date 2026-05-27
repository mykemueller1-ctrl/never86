import RoleView from '@/components/RoleView';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: "Command Center | Never 86'd" };

// CEO view (default). Operator 3 = Taco Bamba until per-user auth selects operator.
export default function CommandCenterPage() {
  return <RoleView operatorId={3} role="ceo" displayName="Taco Bamba" />;
}
