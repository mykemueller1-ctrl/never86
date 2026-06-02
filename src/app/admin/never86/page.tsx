import { loadAdminSnapshot, type DailyFocus, type AeoDraft, type TeamNote, type PipelineRow, type QuickWin } from '@/lib/adminDb';
import { addFocus, updateFocusStatus, addAeoDraft, addTeamNote, addPipelineRow, updatePipelineStage, sendFollowupNow } from './actions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  in_call: 'In conversation',
  design_partner: 'Design partner',
  internal_pilot: 'Internal pilot',
  signed: 'Signed',
  paused: 'Paused',
  closed: 'Closed',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
};

function focusBadge(status: string | null) {
  const key = status || 'todo';
  const color: Record<string, string> = {
    todo: 'bg-dark-700 text-dark-200 border-dark-600',
    in_progress: 'bg-gold-500/10 text-gold-300 border-gold-700/40',
    blocked: 'bg-red-500/10 text-red-300 border-red-700/40',
    done: 'bg-green-500/10 text-green-300 border-green-700/40',
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider font-semibold rounded-full border px-2.5 py-0.5 ${color[key] ?? color.todo}`}>
      {STATUS_LABELS[key] ?? key}
    </span>
  );
}

function SectionHeader({ id, title, kicker }: { id: string; title: string; kicker?: string }) {
  return (
    <div id={id} className="mb-4 flex items-end justify-between gap-3 scroll-mt-24">
      <div>
        {kicker ? <p className="text-gold-500 text-[10px] uppercase tracking-widest mb-1">{kicker}</p> : null}
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
    </div>
  );
}

export default async function AdminNever86() {
  const snap = await loadAdminSnapshot();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const focusByAuthor = new Map<string, DailyFocus[]>();
  for (const f of snap.focus) {
    if (!focusByAuthor.has(f.author)) focusByAuthor.set(f.author, []);
    focusByAuthor.get(f.author)!.push(f);
  }
  const mykeFocus = focusByAuthor.get('myke') ?? [];
  const victorTeam = snap.team.filter((t) => t.author === 'victor');
  const mykeTeam = snap.team.filter((t) => t.author === 'myke');
  const live = snap.quickWins.filter((w: QuickWin) => w.status === 'live');
  const ideas = snap.quickWins.filter((w: QuickWin) => w.status !== 'live');

  return (
    <main className="min-h-screen text-dark-50">
      <header className="border-b border-white/5 sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="brand-monogram">N86</span>
            <div className="flex items-baseline gap-2.5">
              <span className="font-display font-semibold tracking-tight text-dark-50 text-lg">Never 86&apos;d</span>
              <span className="text-gold-400 text-[10px] uppercase tracking-[0.22em] font-mono">CEO Command Center</span>
            </div>
          </div>
          <nav className="flex items-center gap-0.5 text-xs">
            <a href="#focus" className="hidden md:inline px-2.5 py-1.5 text-dark-200 hover:text-white rounded-lg hover:bg-white/[0.03]">Focus</a>
            <a href="#aeo" className="hidden md:inline px-2.5 py-1.5 text-dark-200 hover:text-white rounded-lg hover:bg-white/[0.03]">AEO drafts</a>
            <a href="#team" className="hidden md:inline px-2.5 py-1.5 text-dark-200 hover:text-white rounded-lg hover:bg-white/[0.03]">Team</a>
            <a href="#pipeline" className="hidden md:inline px-2.5 py-1.5 text-dark-200 hover:text-white rounded-lg hover:bg-white/[0.03]">Pipeline</a>
            <a href="#wins" className="hidden md:inline px-2.5 py-1.5 text-dark-200 hover:text-white rounded-lg hover:bg-white/[0.03]">Quick wins</a>
            <a href="#leads" className="hidden md:inline px-2.5 py-1.5 text-dark-200 hover:text-white rounded-lg hover:bg-white/[0.03]">Leads</a>
            <a href="#activity" className="hidden md:inline px-2.5 py-1.5 text-dark-200 hover:text-white rounded-lg hover:bg-white/[0.03]">Activity</a>
            <a href="#ops" className="hidden md:inline px-2.5 py-1.5 text-dark-200 hover:text-white rounded-lg hover:bg-white/[0.03]">Ops</a>
            <a href="/" className="border border-white/10 hover:border-gold-500/60 hover:bg-gold-500/5 text-dark-50 rounded-lg px-3 py-1.5 ml-2 transition-colors">Site</a>
            <a href="/command-center" className="border border-white/10 hover:border-gold-500/60 hover:bg-gold-500/5 text-dark-50 rounded-lg px-3 py-1.5 transition-colors">Operator view</a>
          </nav>
        </div>
      </header>

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-40 pointer-events-none" />
        <div className="hero-orb pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 mb-4">
            <span className="live-dot" />
            <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-dark-100">Today · {today}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">Myke Mueller — Daily focus</h1>
          <p className="text-dark-200 mt-3 max-w-2xl leading-relaxed">The honest ledger. What you said you&apos;d do, what got done, what&apos;s blocked, what ships next. Drop entries here through the day — they roll up into the weekly view.</p>
        </div>
      </div>

      {/* DAILY FOCUS */}
      <section id="focus" className="max-w-6xl mx-auto px-6 py-8">
        <SectionHeader id="focus" kicker="Section 01" title="Daily focus" />
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-dark-700 border border-dark-600 rounded-2xl">
            <div className="divide-y divide-dark-600">
              {mykeFocus.length === 0 ? (
                <p className="p-6 text-dark-300 text-sm">No focus entries yet — add the first one.</p>
              ) : (
                mykeFocus.map((f) => (
                  <div key={f.id} className="p-4 flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-dark-400 text-[11px] tabular-nums">{f.entry_date}</span>
                        {focusBadge(f.status)}
                      </div>
                      <p className="text-white text-sm leading-relaxed">{f.body}</p>
                    </div>
                    <form action={updateFocusStatus} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={f.id} />
                      <select name="status" defaultValue={f.status ?? 'todo'} className="bg-dark-800 border border-dark-600 rounded text-xs text-dark-200 px-2 py-1">
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <button type="submit" className="text-gold-400 hover:text-gold-300 text-xs">save</button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>

          <form action={addFocus} className="bg-dark-700 border border-dark-600 rounded-2xl p-5 space-y-3 h-fit">
            <p className="text-gold-500 text-[10px] uppercase tracking-widest">Add focus</p>
            <input type="hidden" name="author" value="myke" />
            <textarea name="body" required placeholder="What are you working on right now?" rows={4} className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-gold-500" />
            <select name="status" defaultValue="todo" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500">
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button type="submit" className="w-full bg-gold-500 hover:bg-gold-400 text-dark-900 font-semibold rounded-lg px-3 py-2 text-sm">Save</button>
          </form>
        </div>
      </section>

      {/* AEO DRAFTS */}
      <section id="aeo" className="max-w-6xl mx-auto px-6 py-8">
        <SectionHeader id="aeo" kicker="Section 02" title="AEO drafts — the answer-engine layer" />
        <p className="text-dark-300 text-sm mb-4 max-w-3xl">One question, one defensible answer. These ship as standalone pages that AI search engines (ChatGPT, Gemini, Perplexity, Google AI Overviews) can cite. Every answer ends with the source-tag discipline.</p>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-3">
            {snap.aeo.length === 0 ? (
              <p className="text-dark-300 text-sm bg-dark-700 border border-dark-600 rounded-2xl p-6">No drafts yet — add the first one.</p>
            ) : (
              snap.aeo.map((d: AeoDraft) => (
                <div key={d.id} className="bg-dark-700 border border-dark-600 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-white font-semibold">{d.title}</p>
                      <p className="text-dark-400 text-xs mt-0.5">by {d.author} · {d.audience ?? 'general'}</p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold rounded-full px-2.5 py-0.5 border ${d.status === 'published' ? 'bg-green-500/10 text-green-300 border-green-700/40' : 'bg-gold-500/10 text-gold-300 border-gold-700/40'}`}>{d.status}</span>
                  </div>
                  {d.question ? <p className="text-dark-300 text-xs italic mb-2">Q: {d.question}</p> : null}
                  <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap">{d.answer}</p>
                </div>
              ))
            )}
          </div>

          <form action={addAeoDraft} className="bg-dark-700 border border-dark-600 rounded-2xl p-5 space-y-3 h-fit">
            <p className="text-gold-500 text-[10px] uppercase tracking-widest">Add draft</p>
            <select name="author" defaultValue="myke" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm">
              <option value="myke">Myke</option>
              <option value="victor">Victor</option>
            </select>
            <input name="title" required placeholder="Title" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-gold-500" />
            <input name="question" placeholder="The question this answers" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-gold-500" />
            <textarea name="answer" required rows={5} placeholder="The answer (operator voice, with source-tag discipline)" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-gold-500" />
            <input name="audience" placeholder="Audience (e.g. multi-unit operator)" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-gold-500" />
            <button type="submit" className="w-full bg-gold-500 hover:bg-gold-400 text-dark-900 font-semibold rounded-lg px-3 py-2 text-sm">Save draft</button>
          </form>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" className="max-w-6xl mx-auto px-6 py-8">
        <SectionHeader id="team" kicker="Section 03" title="The crew" />
        <p className="text-dark-300 text-sm mb-4 max-w-3xl">Each crew member gets their own area — focus, schedule, drafts, ideas. The crew is small on purpose.</p>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-dark-700 border border-dark-600 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold">Victor</p>
              <span className="text-dark-400 text-[10px] uppercase tracking-wider">co-founder area</span>
            </div>
            <div className="space-y-3">
              {victorTeam.length === 0 ? (
                <p className="text-dark-300 text-sm">Nothing here yet — Victor adds his stuff below.</p>
              ) : (
                victorTeam.map((n: TeamNote) => (
                  <div key={n.id} className="border-l-2 border-gold-700/60 pl-3">
                    <p className="text-dark-400 text-[10px] uppercase tracking-wider mb-0.5">{n.kind} · {n.note_date}</p>
                    {n.title ? <p className="text-white text-sm font-medium">{n.title}</p> : null}
                    <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap">{n.body}</p>
                  </div>
                ))
              )}
            </div>
            <form action={addTeamNote} className="mt-4 space-y-2">
              <input type="hidden" name="author" value="victor" />
              <select name="kind" defaultValue="note" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white text-xs">
                <option value="focus">Focus</option>
                <option value="schedule">Schedule</option>
                <option value="draft">AEO draft idea</option>
                <option value="note">Note</option>
              </select>
              <input name="title" placeholder="Title (optional)" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-xs" />
              <textarea name="body" required rows={3} placeholder="What's the entry?" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-xs" />
              <button type="submit" className="w-full bg-gold-500 hover:bg-gold-400 text-dark-900 font-semibold rounded-lg px-3 py-2 text-xs">Save for Victor</button>
            </form>
          </div>

          <div className="bg-dark-700 border border-dark-600 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold">Myke — extra notes</p>
              <span className="text-dark-400 text-[10px] uppercase tracking-wider">your area</span>
            </div>
            <div className="space-y-3">
              {mykeTeam.length === 0 ? (
                <p className="text-dark-300 text-sm">Quick notes / schedule entries go here.</p>
              ) : (
                mykeTeam.map((n: TeamNote) => (
                  <div key={n.id} className="border-l-2 border-gold-700/60 pl-3">
                    <p className="text-dark-400 text-[10px] uppercase tracking-wider mb-0.5">{n.kind} · {n.note_date}</p>
                    {n.title ? <p className="text-white text-sm font-medium">{n.title}</p> : null}
                    <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap">{n.body}</p>
                  </div>
                ))
              )}
            </div>
            <form action={addTeamNote} className="mt-4 space-y-2">
              <input type="hidden" name="author" value="myke" />
              <select name="kind" defaultValue="note" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white text-xs">
                <option value="focus">Focus</option>
                <option value="schedule">Schedule</option>
                <option value="draft">AEO draft idea</option>
                <option value="note">Note</option>
              </select>
              <input name="title" placeholder="Title (optional)" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-xs" />
              <textarea name="body" required rows={3} placeholder="What's the entry?" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-xs" />
              <button type="submit" className="w-full bg-gold-500 hover:bg-gold-400 text-dark-900 font-semibold rounded-lg px-3 py-2 text-xs">Save</button>
            </form>
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <section id="pipeline" className="max-w-6xl mx-auto px-6 py-8">
        <SectionHeader id="pipeline" kicker="Section 04" title="Operator pipeline" />
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-dark-700 border border-dark-600 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600 text-dark-400 text-[10px] uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Operator</th>
                  <th className="text-left px-4 py-3 font-medium">Units</th>
                  <th className="text-left px-4 py-3 font-medium">Stage</th>
                  <th className="text-left px-4 py-3 font-medium">Next step</th>
                </tr>
              </thead>
              <tbody>
                {snap.pipeline.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-dark-300 text-sm">No operators in pipeline yet.</td></tr>
                ) : (
                  snap.pipeline.map((p: PipelineRow) => (
                    <tr key={p.id} className="border-b border-dark-600/60 last:border-0">
                      <td className="px-4 py-3 text-white">
                        <p className="font-medium">{p.operator_name}</p>
                        {p.contact_name ? <p className="text-dark-400 text-xs">{p.contact_name}</p> : null}
                        {p.notes ? <p className="text-dark-400 text-xs mt-0.5">{p.notes}</p> : null}
                      </td>
                      <td className="px-4 py-3 text-dark-200 tabular-nums">{p.units ?? '—'}</td>
                      <td className="px-4 py-3">
                        <form action={updatePipelineStage} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={p.id} />
                          <select name="stage" defaultValue={p.stage} className="bg-dark-800 border border-dark-600 rounded text-xs text-dark-200 px-2 py-1">
                            {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                          <button type="submit" className="text-gold-400 hover:text-gold-300 text-xs">save</button>
                        </form>
                      </td>
                      <td className="px-4 py-3 text-dark-200">
                        {p.next_step ? <p>{p.next_step}</p> : <span className="text-dark-400">—</span>}
                        {p.next_step_date ? <p className="text-dark-400 text-xs">{p.next_step_date}</p> : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <form action={addPipelineRow} className="bg-dark-700 border border-dark-600 rounded-2xl p-5 space-y-3 h-fit">
            <p className="text-gold-500 text-[10px] uppercase tracking-widest">Add operator</p>
            <input name="operator_name" required placeholder="Operator / group name" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-gold-500" />
            <input name="contact_name" placeholder="Contact (name / title)" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-sm" />
            <input name="units" type="number" min="1" placeholder="Units" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-sm" />
            <select name="stage" defaultValue="lead" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm">
              {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input name="next_step" placeholder="Next step" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-sm" />
            <textarea name="notes" placeholder="Notes" rows={2} className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 text-sm" />
            <button type="submit" className="w-full bg-gold-500 hover:bg-gold-400 text-dark-900 font-semibold rounded-lg px-3 py-2 text-sm">Add to pipeline</button>
          </form>
        </div>
      </section>

      {/* QUICK WINS */}
      <section id="wins" className="max-w-6xl mx-auto px-6 py-8">
        <SectionHeader id="wins" kicker="Section 05" title="Quick wins lineup" />
        <p className="text-dark-300 text-sm mb-4 max-w-3xl">The MCP-friendly drop-in tools. Owner · manager · frontline. These are the "holy shit" moments that get operators on the platform.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {live.map((w: QuickWin) => (
            <a key={w.id} href={w.demo_url ?? '#'} className="bg-dark-700 border border-green-700/40 rounded-2xl p-5 block hover:border-green-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-semibold">{w.name}</p>
                <span className="text-[10px] uppercase tracking-wider font-semibold rounded-full px-2 py-0.5 bg-green-500/10 text-green-300 border border-green-700/40">live</span>
              </div>
              {w.audience ? <p className="text-gold-400 text-[10px] uppercase tracking-wider mb-1">for {w.audience}s</p> : null}
              <p className="text-dark-300 text-sm leading-relaxed">{w.pitch}</p>
            </a>
          ))}
          {ideas.map((w: QuickWin) => (
            <div key={w.id} className="bg-dark-700 border border-dark-600 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-semibold">{w.name}</p>
                <span className="text-[10px] uppercase tracking-wider font-semibold rounded-full px-2 py-0.5 bg-gold-500/10 text-gold-300 border border-gold-700/40">{w.status}</span>
              </div>
              {w.audience ? <p className="text-gold-400 text-[10px] uppercase tracking-wider mb-1">for {w.audience}s</p> : null}
              <p className="text-dark-300 text-sm leading-relaxed">{w.pitch}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LEADS */}
      <section id="leads" className="max-w-6xl mx-auto px-6 py-8">
        <SectionHeader id="leads" kicker="Section 06" title="Leads" />
        <p className="text-dark-300 text-sm mb-4">Anyone who hit the form — homepage, /operators, role pages. Welcome email sent · Myke notified · 24h + 7d follow-ups queued.</p>
        {snap.leads.length === 0 ? (
          <p className="text-dark-300 text-sm bg-dark-700 border border-dark-600 rounded-2xl p-6">No leads yet. When someone hits the form they land here.</p>
        ) : (
          <div className="bg-dark-700 border border-dark-600 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600 text-dark-400 text-[10px] uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">When</th>
                  <th className="text-left px-4 py-3 font-medium">Name · Email</th>
                  <th className="text-left px-4 py-3 font-medium">Restaurant</th>
                  <th className="text-left px-4 py-3 font-medium">Units</th>
                  <th className="text-left px-4 py-3 font-medium">From</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Send now</th>
                </tr>
              </thead>
              <tbody>
                {snap.leads.map((l) => (
                  <tr key={l.id} className="border-b border-dark-600/60 last:border-0">
                    <td className="px-4 py-3 text-dark-400 text-xs tabular-nums">{l.created_at.slice(0, 16).replace('T', ' ')}</td>
                    <td className="px-4 py-3 text-white">
                      <p className="font-medium">{l.name ?? '—'}</p>
                      <p className="text-dark-400 text-xs">{l.email}</p>
                    </td>
                    <td className="px-4 py-3 text-dark-200">{l.restaurant_name ?? '—'}</td>
                    <td className="px-4 py-3 text-dark-200 tabular-nums">{l.units ?? '—'}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{l.source_page ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] uppercase tracking-wider font-semibold rounded-full border bg-gold-500/10 text-gold-300 border-gold-700/40 px-2.5 py-0.5">{l.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <form action={sendFollowupNow}>
                          <input type="hidden" name="leadId" value={l.id} />
                          <input type="hidden" name="kind" value="24h" />
                          <button type="submit" className="text-gold-400 hover:text-gold-300 underline">24h</button>
                        </form>
                        <span className="text-dark-500">·</span>
                        <form action={sendFollowupNow}>
                          <input type="hidden" name="leadId" value={l.id} />
                          <input type="hidden" name="kind" value="7d" />
                          <button type="submit" className="text-gold-400 hover:text-gold-300 underline">7d</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ACTIVITY */}
      <section id="activity" className="max-w-6xl mx-auto px-6 py-8">
        <SectionHeader id="activity" kicker="Section 07" title="Anonymous visitor activity" />
        <p className="text-dark-300 text-sm mb-4">Real-time feed of who&apos;s clicking what. Demo views, role views, page views — bucketed by session.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {/* Agent rollup */}
          <div className="md:col-span-1 bg-dark-700 border border-dark-600 rounded-2xl p-5">
            <p className="text-gold-500 text-[10px] uppercase tracking-widest mb-3">Top agents · last 50 views</p>
            {snap.agentRollup.length === 0 ? (
              <p className="text-dark-300 text-sm">No agent views yet.</p>
            ) : (
              <ul className="space-y-2">
                {snap.agentRollup.map((r) => (
                  <li key={r.agent_name} className="flex items-center justify-between text-sm">
                    <span className="text-white">{r.agent_name}</span>
                    <span className="text-gold-300 tabular-nums font-mono">{r.views}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Live event feed */}
          <div className="md:col-span-2 bg-dark-700 border border-dark-600 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600 text-dark-400 text-[10px] uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">When</th>
                  <th className="text-left px-4 py-3 font-medium">Event</th>
                  <th className="text-left px-4 py-3 font-medium">What</th>
                  <th className="text-left px-4 py-3 font-medium">Session</th>
                </tr>
              </thead>
              <tbody>
                {snap.events.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-dark-300 text-sm">No events yet — visitors landing on demos or role pages will show here.</td></tr>
                ) : (
                  snap.events.map((e) => (
                    <tr key={e.id} className="border-b border-dark-600/60 last:border-0">
                      <td className="px-4 py-3 text-dark-400 text-xs tabular-nums">{e.created_at.slice(11, 19)}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] uppercase tracking-wider font-mono text-gold-300">{e.event_type}</span>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {e.agent_name ?? e.audience ?? e.page_path ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-dark-400 text-xs font-mono">{e.session_id?.slice(0, 12) ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* OPS HEALTH */}
      <section id="ops" className="max-w-6xl mx-auto px-6 py-8">
        <SectionHeader id="ops" kicker="Section 08" title="Ops health" />
        <div className="grid md:grid-cols-3 gap-4">
          <a href="/api/ops-health" className="bg-dark-700 border border-dark-600 hover:border-gold-500 rounded-2xl p-5 block">
            <p className="text-white font-semibold mb-1">Database</p>
            <p className="text-dark-400 text-xs">Live ops DB health probe — count of locations &amp; round-trip ms</p>
          </a>
          <a href="/command-center" className="bg-dark-700 border border-dark-600 hover:border-gold-500 rounded-2xl p-5 block">
            <p className="text-white font-semibold mb-1">Operator command center</p>
            <p className="text-dark-400 text-xs">What your design partners see when they sign in</p>
          </a>
          <a href="/" className="bg-dark-700 border border-dark-600 hover:border-gold-500 rounded-2xl p-5 block">
            <p className="text-white font-semibold mb-1">Marketing surface</p>
            <p className="text-dark-400 text-xs">The public homepage — same one your prospects land on</p>
          </a>
        </div>
      </section>

      <footer className="border-t border-dark-700 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-dark-400 text-xs flex flex-wrap items-center justify-between gap-3">
          <span>Never 86&apos;d · CEO Command Center · Internal only</span>
          <span>Source-tagged · Operator-turned-founder native AI</span>
        </div>
      </footer>
    </main>
  );
}
