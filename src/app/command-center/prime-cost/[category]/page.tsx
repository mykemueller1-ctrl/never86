import { notFound } from 'next/navigation';
import { PrimeCostCategoryDesk } from '@/components/PrimeCostCategoryDesk';
import { buildPrimeCostBoard, getPrimeCostDesk, isPrimeCostCategory, PRIME_COST_CATEGORIES } from '@/lib/primeCostDesks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = {
  title: "Prime cost desk | Command Center | Never 86'd",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return PRIME_COST_CATEGORIES.filter((category) => category !== 'sales').map((category) => ({ category }));
}

export default async function PrimeCostCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!isPrimeCostCategory(category) || category === 'sales') notFound();
  const board = buildPrimeCostBoard();
  return <PrimeCostCategoryDesk board={board} desk={getPrimeCostDesk(category)} />;
}
