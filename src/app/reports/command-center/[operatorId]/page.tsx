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
  // Operator 3 = Taco Bamba; friendly label, everyone else uses their own.
  const displayName = operatorId === 3 ? 'Taco Bamba' : undefined;
  return <CommandCenter operatorId={operatorId} displayName={displayName} />;
}
