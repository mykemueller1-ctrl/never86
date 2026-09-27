'use client';

import { useEffect } from 'react';
import { trackPublic } from '@/lib/publicAnalytics';

export function OnboardStartBeacon() {
  useEffect(() => {
    trackPublic('onboard_start', { path: '/onboard' });
  }, []);
  return null;
}
