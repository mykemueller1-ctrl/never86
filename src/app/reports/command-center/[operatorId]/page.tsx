import { notFound } from 'next/navigation';
import CommandCenter from '@/components/CommandCenter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: "Command Center | Never 86'd",
};

export default function CommandCenterPage({ params }: { params: { operatorId: string } }) {
  const operatorId = Number.parseInt(params.operatorId, 10);
  if (!Number.isInteger(operatorId) || operatorId <= 0) notFound();
  // No displayName override — every operator renders from the scrubbed
  // restaurant_name in operator_users. Real customer names never appear in
  // public-repo source code.
  return <CommandCenter operatorId={operatorId} />;
}
