import { SalesLaborDesk } from '@/components/SalesLaborDesk';
import { buildBambaSalesLaborDesk } from '@/lib/bambaSalesLabor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = {
  title: "Sales · Labor | Command Center | Never 86'd",
  robots: { index: false, follow: false },
};

export default function SalesLaborPage() {
  const desk = buildBambaSalesLaborDesk();
  return <SalesLaborDesk desk={desk} />;
}
