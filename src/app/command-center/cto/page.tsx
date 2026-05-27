import RoleView from '@/components/RoleView';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: "CTO · Command Center | Never 86'd" };

export default function CtoPage() {
  return <RoleView operatorId={3} role="cto" displayName="Taco Bamba" />;
}
