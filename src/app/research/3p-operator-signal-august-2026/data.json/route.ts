import { PUBLIC_SIGNAL_METHOD, THREE_P_PUBLIC_SIGNALS } from '@/lib/threePSocialEvidence';

export function GET() {
  return Response.json({
    title: 'Seven-day public restaurant 3P control signal sample',
    canonical_url: 'https://www.never86.ai/research/3p-operator-signal-august-2026',
    published_at: '2026-08-21',
    methodology: PUBLIC_SIGNAL_METHOD,
    count: THREE_P_PUBLIC_SIGNALS.length,
    limitations: ['Not a census', 'Not an incidence or prevalence estimate', 'Not proof of paid demand', 'Not proof that a charge was wrong', 'Not proof of recoverable dollars'],
    signals: THREE_P_PUBLIC_SIGNALS,
  }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
