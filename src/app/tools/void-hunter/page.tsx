import { getVoidHunter, type VoidHunter } from '@/lib/voidHunter';
import { opsDbConfigured } from '@/lib/opsDb';
import { VoidHunterFrame, VoidHunterBody } from '@/components/VoidHunterView';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: "Void Hunter | Never 86'd" };

export default async function VoidHunterPage() {
  if (!opsDbConfigured()) {
    return (
      <VoidHunterFrame>
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
          <p className="text-white font-semibold mb-2">Not connected to the ops database yet.</p>
          <p className="text-dark-300 text-sm">
            Set <code className="text-gold-300">OPS_DATABASE_URL</code> in Vercel, then redeploy.
          </p>
        </div>
      </VoidHunterFrame>
    );
  }

  let d: VoidHunter;
  try {
    d = await getVoidHunter(3);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <VoidHunterFrame>
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
          <p className="text-white font-semibold mb-2">Couldn&apos;t reach the ops database.</p>
          <p className="font-mono text-xs text-dark-400 break-all">{msg}</p>
        </div>
      </VoidHunterFrame>
    );
  }

  return (
    <VoidHunterFrame>
      <VoidHunterBody data={d} />
    </VoidHunterFrame>
  );
}
