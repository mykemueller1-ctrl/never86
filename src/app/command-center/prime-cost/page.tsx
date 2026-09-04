import { PrimeCostDeskHub } from '@/components/PrimeCostDeskHub';
import { buildPrimeCostBoard } from '@/lib/primeCostDesks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = {
  title: "Prime cost desks | Command Center | Never 86'd",
  robots: { index: false, follow: false },
};

export default function PrimeCostHubPage() {
  return <PrimeCostDeskHub board={buildPrimeCostBoard()} />;
}
