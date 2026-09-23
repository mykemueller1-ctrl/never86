'use client';

import { HonestyLegend } from '@/components/HonestyLegend';
import type { HonestyLabel } from '@/lib/oneSeatPublicWin';

export function AuthHonestyLine({
  honesty,
  message,
  className,
}: {
  honesty: HonestyLabel | null;
  message: string;
  className?: string;
}) {
  if (!message) return null;
  if (honesty) {
    return <HonestyLegend active={honesty} note={message} />;
  }
  return (
    <p className={className} role="alert">
      {message}
    </p>
  );
}
