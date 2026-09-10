'use client';

const JOBS = [
  { id: 'invoice', title: 'Check an invoice', detail: 'Start with one. Add an earlier invoice to compare prices.', question: 'Check this invoice. Show the source for each finding. Ask for an earlier comparable invoice before claiming price drift.' },
  { id: 'labor', title: 'Check my labor', detail: 'Compare a schedule with time punches from the same dates.', question: 'Compare my schedule with actual time punches for the same dates. Separate missing records from confirmed labor drift.' },
  { id: 'handoff', title: 'Sort out this shift', detail: 'Turn a messy shift note into a clear next action.', question: 'Help me turn this shift note into one clear action. Ask who owns it and when it is due before treating it as assigned.' },
] as const;

export function OperatorQuickStart({ selected, onSelect, onFile, onPhoto, busy }: {
  selected: string | null;
  onSelect: (id: string, question: string) => void;
  onFile: () => void;
  onPhoto: () => void;
  busy: boolean;
}) {
  return <section className="operator-start" aria-label="Choose your first job">
    <p className="owner-desk-poetry">Start with what you have. One invoice, a schedule, or a shift note. We’ll tell you what it shows and what we need next.</p>
    <div className="operator-start-grid">
      {JOBS.map(job => <button key={job.id} type="button" disabled={busy} className="operator-start-card" aria-pressed={selected === job.id} onClick={() => onSelect(job.id, job.question)}>
        <strong>{job.title}<span aria-hidden> ↗</span></strong><span>{job.detail}</span>
      </button>)}
    </div>
    {selected ? <p className="operator-start-hint" role="status">Your starting question is below. Add your {selected === 'handoff' ? 'shift note, then send.' : 'file or photo, then review the result.'}</p> : null}
    <div className="operator-start-actions">
      <button type="button" disabled={busy} className="owner-desk-primary" onClick={onFile}>Add a file</button>
      <button type="button" disabled={busy} className="owner-desk-secondary" onClick={onPhoto}>Take a photo</button>
    </div>
  </section>;
}
