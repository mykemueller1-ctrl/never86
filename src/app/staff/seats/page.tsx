import type { Metadata } from 'next';
import { StaffSeatReadinessDesk } from '@/components/StaffSeatReadinessDesk';

export const metadata: Metadata = {
  title: "Staff seats | Never 86'd",
  description: 'Manager-first station seats, tenant boundary, and synthetic invite receipts. Live credentials are not issued.',
  robots: { index: false, follow: false },
};

export default function StaffSeatsPage() {
  return <StaffSeatReadinessDesk />;
}
