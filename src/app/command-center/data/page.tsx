import RoleView from '@/components/RoleView';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: "Data Lead · Command Center | Never 86'd" };

export default function DataLeadPage() {
  return <RoleView operatorId={3} role="data" />;
}
