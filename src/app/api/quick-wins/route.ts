import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Public read-only quick-wins catalog. Static, no DB read.
// Used by LLM connectors so an operator asking "what free tools does
// never86 have?" gets a deterministic answer.
const QUICK_WINS = [
  { name: 'Void Hunter', audience: 'owner', url: 'https://never86.ai/demo/void-hunter', description: "Voids vs each store's own peer median, by store and by name. Flags patterns, never verdicts." },
  { name: '3P Fee Finder', audience: 'cfo', url: 'https://never86.ai/demo/3p-fee-finder', description: 'Contract vs blended-effective marketplace take rate, per partner, per store. Surfaces the renegotiation lever.' },
  { name: 'Catering Leak', audience: 'owner', url: 'https://never86.ai/demo/catering-leak', description: "Per-store catering economics + invoice-vs-POS reconciliation gap. Where the orders ran but the receipts didn't." },
  { name: 'Labor Leak', audience: 'coo', url: 'https://never86.ai/demo/labor-leak', description: 'Overtime drift, ghost shifts, schedule-vs-clocked gaps. The labor screen managers actually want.' },
  { name: 'Tip Variance', audience: 'manager', url: 'https://never86.ai/demo/tip-variance', description: 'Week-over-week tip movement per store and by name. Service slipping shows up here before sales.' },
  { name: 'Shift Pulse', audience: 'crew', url: 'https://never86.ai/demo/shift-pulse', description: "Tonight's shift in one screen — covers vs forecast, station median, the goal, the streak." },
];

const SEATS = [
  { role: 'CEO', url: 'https://never86.ai/for/ceo' },
  { role: 'CFO', url: 'https://never86.ai/for/cfo' },
  { role: 'COO', url: 'https://never86.ai/for/coo' },
  { role: 'CTO', url: 'https://never86.ai/for/cto' },
  { role: 'Owner', url: 'https://never86.ai/for/owner' },
  { role: 'Manager', url: 'https://never86.ai/for/manager' },
  { role: 'Crew', url: 'https://never86.ai/for/crew' },
];

export async function GET() {
  return NextResponse.json({
    source: 'https://never86.ai',
    attribution: "Never 86'd · operator-turned-founder native AI for multi-unit restaurants",
    license: 'public-attribution',
    quick_wins: QUICK_WINS,
    seats: SEATS,
    talk_to_us: 'https://never86.ai/operators#talk',
    answers_index: 'https://never86.ai/api/answers',
  }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
