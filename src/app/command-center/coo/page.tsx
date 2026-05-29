import RoleView from '@/components/RoleView';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: "COO · Command Center | Never 86'd" };

export default function CooPage() {
  return <RoleView operatorId={3} role="coo" />;
}
