import { notFound } from 'next/navigation';
import OperatorReportView from '@/components/OperatorReportView';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: "Operator Report | Never 86'd",
};

export default async function OperatorReportPage({ params }: { params: Promise<{ operatorId: string }> }) {
  const { operatorId: rawOperatorId } = await params;
  const operatorId = Number.parseInt(rawOperatorId, 10);
  if (!Number.isInteger(operatorId) || operatorId <= 0) notFound();
  return <OperatorReportView operatorId={operatorId} />;
}
