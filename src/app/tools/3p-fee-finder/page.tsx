import { getThreePFees, type ThreePFees } from '@/lib/threePFees';
import { opsDbConfigured } from '@/lib/opsDb';
import { ThreePFeeFinderFrame, ThreePFeeFinderBody } from '@/components/ThreePFeeFinderView';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: "3P Fee Finder | Never 86'd" };

export default async function ThreePFeeFinderPage() {
  if (!opsDbConfigured()) {
    return (
      <ThreePFeeFinderFrame>
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
          <p className="text-white font-semibold mb-2">Your live data isn&apos;t connected yet.</p>
          <p className="text-dark-300 text-sm">If you&apos;re seeing this, contact the team and we&apos;ll bring you online.</p>
        </div>
      </ThreePFeeFinderFrame>
    );
  }

  let d: ThreePFees;
  try {
    d = await getThreePFees(3);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <ThreePFeeFinderFrame>
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
          <p className="text-white font-semibold mb-2">Couldn&apos;t reach your live data.</p>
          <p className="font-mono text-xs text-dark-400 break-all">{msg}</p>
        </div>
      </ThreePFeeFinderFrame>
    );
  }

  return (
    <ThreePFeeFinderFrame>
      <ThreePFeeFinderBody data={d} />
    </ThreePFeeFinderFrame>
  );
}
