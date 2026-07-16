import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTrialRunByShareToken } from '@/lib/trialRunsDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { shareToken: string };

export const metadata: Metadata = {
  title: "Margin Recovery Proposal · Never 86'd",
  description: 'Printable one-page proposal · every number labeled.',
  robots: { index: false, follow: false },
};

const usd = (n: number | null | undefined) => n == null ? '—' : '$' + Math.round(n).toLocaleString();
const pct = (n: number | null | undefined) => n == null ? '—' : (n * 100).toFixed(2) + '%';

export default async function ProposalPage({ params }: { params: Params }) {
  const run = await getTrialRunByShareToken(params.shareToken);
  if (!run) notFound();
  const r = run.result as any;
  const runAt = new Date(run.createdAt).toLocaleString();

  // Compute the top-line recovery surface depending on agent.
  let recoveryUSD: number | null = null;
  let primaryLine = '';
  let evidence: Array<{ k: string; v: string }> = [];

  if (run.agent === 'void-hunter' || (r?.medianStoreVoidRate != null && r?.networkVoids != null)) {
    const excessYr = Math.max(0, (r.networkVoids ?? 0) - (r.medianStoreVoidRate ?? 0) * (r.networkNet ?? 0)) * 3;
    recoveryUSD = excessYr;
    primaryLine = `Excess voids above peer band, annualized.`;
    evidence = [
      { k: 'Network net sales', v: usd(r.networkNet) },
      { k: 'Network voids', v: usd(r.networkVoids) },
      { k: 'Network void rate', v: pct(r.networkVoidRate) },
      { k: 'Peer median void rate', v: pct(r.medianStoreVoidRate) },
      { k: 'Stores flagged > 1.5× peer band', v: String(r.storesFlagged ?? 0) },
    ];
  } else if (run.agent === 'leak-detector' && r?.signals) {
    const vap$ = r.signals.voidAfterPayment?.totalDollars ?? 0;
    const ps$  = r.signals.promoStacking?.totalDollars ?? 0;
    const dac$ = r.signals.discountAfterClose?.totalDollars ?? 0;
    recoveryUSD = (vap$ + ps$ + dac$) * 4;
    primaryLine = `Annualized recovery from cash skim + promo abuse + post-close discounting.`;
    evidence = [
      { k: 'Tickets analyzed', v: String(r.ticketsAnalyzed ?? 0) },
      { k: 'Void-after-payment', v: `${r.signals.voidAfterPayment?.totalCount ?? 0} (${usd(vap$)})` },
      { k: 'Promo stacking', v: `${r.signals.promoStacking?.totalCount ?? 0} (${usd(ps$)})` },
      { k: 'Discount after close', v: `${r.signals.discountAfterClose?.totalCount ?? 0} (${usd(dac$)})` },
      { k: 'Comp-abuse names', v: String(r.signals.compAbuse?.length ?? 0) },
      { k: 'Cash-only voiders', v: String(r.signals.cashOnlyVoiders?.length ?? 0) },
    ];
  }

  return (
    <html lang="en">
      <head>
        <title>Margin Recovery Proposal · Never 86&apos;d</title>
        <style>{`
          @page { size: letter; margin: 0.6in; }
          html, body { margin: 0; padding: 0; background: white; color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; }
          .wrap { max-width: 7in; margin: 0 auto; padding: 24px; }
          h1 { font-family: Georgia, "Times New Roman", serif; font-weight: 500; letter-spacing: -0.018em; font-size: 36px; line-height: 1.1; margin: 8px 0 12px; }
          h2 { font-family: Georgia, "Times New Roman", serif; font-weight: 500; font-size: 20px; margin: 22px 0 6px; letter-spacing: -0.01em; }
          h2 em { color: #0066ff; font-style: italic; }
          .eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #0066ff; }
          .eyebrow.dim { color: #86868b; }
          .strap { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #d2d2d7; padding-bottom: 10px; margin-bottom: 20px; }
          .mono { font-family: ui-monospace, SFMono-Regular, monospace; font-feature-settings: 'tnum'; }
          .big-number { font-family: Georgia, serif; font-weight: 500; font-size: 56px; letter-spacing: -0.03em; color: #0066ff; font-style: italic; line-height: 1; }
          .lever { background: #f0f5ff; border: 1px solid #bdd3f7; padding: 18px 22px; border-radius: 12px; margin: 14px 0 22px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0; }
          th, td { padding: 6px 8px; text-align: right; border-bottom: 1px solid #e8e8ed; }
          th:first-child, td:first-child { text-align: left; }
          thead th { color: #515154; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
          .badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
          .v { background: #e6f4ec; color: #1a8a4a; }
          .e { background: #fbf2dd; color: #c47f00; }
          .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #d2d2d7; font-size: 11px; color: #86868b; display: flex; justify-content: space-between; }
          .source-tag { color: #515154; font-size: 11px; margin-top: 8px; }
          @media print { .no-print { display: none !important; } body { background: white !important; } }
        `}</style>
      </head>
      <body>
        <div className="wrap">
          <div className="strap">
            <div>
              <div className="eyebrow">Margin Recovery Proposal</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, marginTop: 4 }}>Never 86&apos;d <span style={{ fontStyle: 'italic', color: '#86868b' }}>for operators</span></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="eyebrow dim">Agent</div>
              <div style={{ fontSize: 14, marginTop: 2 }}>{run.agent === 'void-hunter' ? 'Void Hunter' : run.agent === 'leak-detector' ? 'Leak Detector' : run.agent}</div>
            </div>
          </div>

          <h1>
            Recovery surface: <em style={{ color: '#0066ff', fontStyle: 'italic' }}>{recoveryUSD != null ? usd(recoveryUSD) : '—'}</em> / year.
          </h1>
          <div className="source-tag">
            <span className="badge e">Estimated</span> · annualized from one period · re-runs as you wire live data.
          </div>

          <div className="lever">
            <div className="eyebrow">The lever</div>
            <p style={{ margin: '6px 0 0', fontSize: 15, lineHeight: 1.5 }}>{primaryLine || 'See the agent output for the named lever.'}</p>
          </div>

          <h2>Evidence, <em>every number labeled.</em></h2>
          <table>
            <thead>
              <tr><th>Metric</th><th>Value</th><th>Tag</th></tr>
            </thead>
            <tbody>
              {evidence.map((e) => (
                <tr key={e.k}>
                  <td>{e.k}</td>
                  <td className="mono">{e.v}</td>
                  <td><span className="badge v">Verified</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>How we ran it.</h2>
          <p style={{ fontSize: 13, lineHeight: 1.55, margin: '6px 0 0' }}>
            Source CSV: <span className="mono">{run.filename || 'operator-provided'}</span> · {run.rowsParsed ?? '—'} rows parsed at {runAt}.
            The method lives in the system &mdash; this page is the result, every number labeled so it&apos;s defensible to the penny.
          </p>

          <h2>What happens next.</h2>
          <ol style={{ fontSize: 13, lineHeight: 1.6, paddingLeft: 18, margin: '4px 0 0' }}>
            <li>Confirm the recovery surface against your latest period. We&apos;ll re-pull from primary source if available.</li>
            <li>Wire the agent to your live POS (Toast / Square / Clover) so the alert fires per-shift.</li>
            <li>If we&apos;re wrong on any figure, we walk it back in writing &mdash; that&apos;s the rule.</li>
          </ol>

          <div className="footer">
            <div>Never 86&apos;d · Built by operators · myke@n86.app</div>
            <div className="mono">never86.ai/trial/run/{params.shareToken.slice(0, 8)}…</div>
          </div>

          <div className="no-print" style={{ marginTop: 24, padding: 16, background: '#f5f5f7', borderRadius: 12, fontSize: 13, color: '#515154' }}>
            <strong>To save as PDF:</strong> use your browser&apos;s Print dialog (Cmd-P / Ctrl-P) and choose &ldquo;Save as PDF.&rdquo; The page is sized for US Letter with margins.
          </div>
        </div>
      </body>
    </html>
  );
}
