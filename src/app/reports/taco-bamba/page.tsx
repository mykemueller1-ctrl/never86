import OperatorReportView from '@/components/OperatorReportView';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: "Taco Bamba — Live Toast Report | Never 86'd",
  description: 'Live net sales by location, pulled straight from Toast. No estimates.',
};

// Taco Bamba is operator 3 (first customer). Friendly alias kept stable.
export default function TacoBambaReportPage() {
  return <OperatorReportView operatorId={3} displayName="Taco Bamba" />;
}
