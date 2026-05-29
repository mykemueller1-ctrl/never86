import RoleView from '@/components/RoleView';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: "CFO · Command Center | Never 86'd" };

export default function CfoPage() {
  return <RoleView operatorId={3} role="cfo" />;
}
