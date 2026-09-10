'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  calculateDemoPour, compareDemoInvoices, compareDemoShifts,
  CURRENT_DEMO_INVOICE, PREVIOUS_DEMO_INVOICE, DEMO_RESTAURANT, DEMO_VENDOR,
  type DemoDraft, type DemoTopic,
} from '@/lib/operatorDemo';
import s from './OperatorDemo.module.css';

const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const number = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 1 });
const duration = (minutes: number) => `${Math.floor(Math.abs(minutes) / 60)} hr${Math.abs(minutes) % 60 ? ` ${Math.abs(minutes) % 60} min` : ''}`;

function Icon({ name, size = 20 }: { name: 'receipt' | 'clock' | 'glass' | 'arrow' | 'check' | 'book' | 'reset' | 'close'; size?: number }) {
  const paths: Record<typeof name, React.ReactNode> = {
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 7h6M9 11h6M9 15h3" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    glass: <><path d="M5 3h14l-2 11a5 5 0 0 1-10 0L5 3ZM12 19v3M8 22h8M6 8h12" /></>,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    book: <><path d="M4 4h7v16H4zM11 4h9v16h-9M7 8h1M14 8h3M14 12h3" /></>,
    reset: <><path d="M4 9a8 8 0 1 1 0 6M4 4v5h5" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const topics: { id: DemoTopic; title: string; short: string; icon: 'receipt' | 'clock' | 'glass'; detail: string }[] = [
  { id: 'invoices', title: 'Invoice prices', short: 'Invoices', icon: 'receipt', detail: 'Same cheese. Different price.' },
  { id: 'labor', title: 'Hours on the clock', short: 'Labor', icon: 'clock', detail: 'Planned hours. Actual hours.' },
  { id: 'pours', title: 'Cost of a pour', short: 'Pours', icon: 'glass', detail: 'Know what goes in the glass.' },
];

export function OperatorDemo() {
  const [topic, setTopic] = useState<DemoTopic>('invoices');
  const [casePrice, setCasePrice] = useState('78');
  const [casePounds, setCasePounds] = useState('30');
  const [cases, setCases] = useState('2');
  const [actualEnd, setActualEnd] = useState('00:00');
  const [nextDay, setNextDay] = useState(true);
  const [unpaidBreak, setUnpaidBreak] = useState('0');
  const [wage, setWage] = useState('');
  const [bottleCost, setBottleCost] = useState('25');
  const [bottleMl, setBottleMl] = useState('750');
  const [pourOz, setPourOz] = useState('1.5');
  const [checked, setChecked] = useState<Partial<Record<DemoTopic, boolean>>>({});
  const [draft, setDraft] = useState<DemoDraft | null>(null);
  const [owner, setOwner] = useState<DemoDraft['owner']>('Alex · sample manager');
  const [dueDay, setDueDay] = useState('Next shift');
  const [dueTime, setDueTime] = useState('16:00');
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftKept, setDraftKept] = useState(false);
  const draftDialog = useRef<HTMLDialogElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const current = { ...CURRENT_DEMO_INVOICE, casePrice: Number(casePrice), poundsPerCase: Number(casePounds), cases: Number(cases) };
  const invoice = compareDemoInvoices(PREVIOUS_DEMO_INVOICE, current);
  const labor = compareDemoShifts(
    { start: '16:00', end: '22:00', nextDay: false, unpaidBreakMinutes: 0 },
    { start: '16:00', end: actualEnd, nextDay, unpaidBreakMinutes: unpaidBreak.trim() ? Number(unpaidBreak) : NaN },
    wage.trim() ? Number(wage) : undefined,
  );
  const pour = calculateDemoPour(Number(bottleCost), Number(bottleMl), Number(pourOz));
  const ready = topic === 'invoices' ? !!invoice : topic === 'labor' ? !!labor : !!pour;
  const wasChecked = !!checked[topic];
  const completeChecks = Object.values(checked).filter(Boolean).length;

  function selectTopic(id: DemoTopic) {
    setTopic(id);
    setDraftOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function runCheck() {
    if (!ready) return;
    setChecked(value => ({ ...value, [topic]: true }));
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
      resultRef.current?.focus({ preventScroll: true });
    }, 30);
  }

  function resetDemo() {
    setTopic('invoices'); setCasePrice('78'); setCasePounds('30'); setCases('2');
    setActualEnd('00:00'); setNextDay(true); setUnpaidBreak('0'); setWage('');
    setBottleCost('25'); setBottleMl('750'); setPourOz('1.5');
    setChecked({}); setDraft(null); setDraftOpen(false); setDraftKept(false);
    setOwner('Alex · sample manager'); setDueDay('Next shift'); setDueTime('16:00');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function openDraft() {
    setDraftKept(false);
    setDraftOpen(true);
    window.setTimeout(() => draftDialog.current?.showModal(), 0);
  }

  function keepDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dueTime || !ready) return;
    const descriptions: Record<DemoTopic, { title: string; evidence: string; proof: string }> = {
      invoices: {
        title: 'Ask about the cheese price change',
        evidence: invoice ? `Fictional invoices SAMPLE-0901 and SAMPLE-0908. CHZ-600: ${money(invoice.previousUnitPrice)}/lb to ${money(invoice.currentUnitPrice)}/lb. Change on ${cases} current cases: ${money(invoice.currentOrderDifference)}.` : '',
        proof: 'Vendor reply or corrected invoice',
      },
      labor: {
        title: 'Review why the shift finished at a different time',
        evidence: labor ? `Fictional schedule: ${duration(labor.plannedMinutes)} paid. Fictional punches: ${duration(labor.actualMinutes)} paid. Difference: ${labor.differenceMinutes} minutes.` : '',
        proof: 'Manager note explaining the hours, with the time record',
      },
      pours: {
        title: 'Check the house pour against the recipe',
        evidence: pour ? `Fictional bottle: ${money(Number(bottleCost))} / ${bottleMl} ml. House pour: ${pourOz} US fl oz. Spirit cost per pour: ${money(pour.costPerPour)}.` : '',
        proof: 'Confirmed recipe and measured pour',
      },
    };
    setDraft({ topic, ...descriptions[topic], owner, dueDay, dueTime });
    setDraftKept(true);
  }

  return <div className={s.app}>
    <a href="#demo-main" className={s.skipLink}>Skip to the demo</a>
    <div className={s.sampleBar}><span className={s.sampleDot} /><strong>Sample demo</strong><span>Fictional restaurant records. No restaurant accounts connected.</span></div>
    <aside className={s.sidebar}>
      <Link className={s.brand} href="/" aria-label="Never86’d home"><span className={s.brandMark}>86</span>Never86<span className={s.brandEnding}>’d</span></Link>
      <div className={s.restaurant}><span className={s.restaurantAvatar}>C</span><div><strong>{DEMO_RESTAURANT}</strong><span>Fictional sample restaurant</span></div></div>
      <p className={s.navLabel}>YOUR OPERATOR DESK</p>
      <nav aria-label="Sample workflows">{topics.map(item => <button type="button" key={item.id} onClick={() => selectTopic(item.id)} aria-current={topic === item.id ? 'page' : undefined}><Icon name={item.icon} /><span>{item.title}</span>{checked[item.id] && <span className={s.navCheck}><Icon name="check" size={14} /></span>}</button>)}</nav>
      <div className={s.sidebarNote}><span className={s.smallStar}>✳</span><p>Find the change.<br />Choose the next move.<br /><strong>Keep the receipt.</strong></p></div>
      <div className={s.sidebarFooter}><span className={s.avatar}>Y</span><div><strong>Your sample seat</strong><span>No account needed</span></div><span className={s.freePill}>DEMO</span></div>
    </aside>
    <div className={s.mainWrap}>
      <header className={s.topbar}><div><strong>{DEMO_RESTAURANT}</strong><span> / Operator desk</span></div><button type="button" onClick={resetDemo}><Icon name="reset" size={15} />Reset sample</button></header>
      <nav className={s.mobileNav} aria-label="Sample workflows">{topics.map(item => <button type="button" key={item.id} aria-current={topic === item.id ? 'page' : undefined} onClick={() => selectTopic(item.id)}><Icon name={item.icon} size={17} />{item.short}</button>)}</nav>
      <main id="demo-main" className={s.layout}>
        <section className={s.mainColumn}>
          <div className={s.intro}><p className={s.eyebrow}>LESS HUNTING. ONE CLEAR NEXT STEP.</p><h1>See what changed.<br /><em>Know what to do.</em></h1><p>Busy shift? Start with one thing. Try a real calculation using the sample records below.</p></div>
          <div className={s.workflowHeader}><div className={`${s.workflowIcon} ${topic === 'labor' ? s.blue : topic === 'pours' ? s.gold : ''}`}><Icon name={topics.find(item => item.id === topic)!.icon} size={24} /></div><div><p className={s.eyebrow}>LET’S CHECK {topic === 'invoices' ? 'THE INVOICES' : topic === 'labor' ? 'THE HOURS' : 'THE POUR'}</p><h2>{topics.find(item => item.id === topic)!.detail}</h2></div><span className={s.stepPill}>About 1 minute</span></div>

          {!wasChecked && <div className={s.checkRow}><button type="button" className={s.primary} disabled={!ready} onClick={runCheck}>{topic === 'invoices' ? 'Check these two invoices' : topic === 'labor' ? 'Compare the hours' : 'Calculate this pour'}<Icon name="arrow" size={18} /></button><span>No signup. No files to upload.</span></div>}

          {topic === 'invoices' && <section aria-label="Sample invoice inputs">
            <div className={s.coach}><span className={s.coachAvatar}>86</span><p>The case looks the same. The price doesn’t. Let’s compare the weight before we call it a price increase.</p></div>
            <div className={s.invoiceGrid}>
              <article className={s.invoiceCard}><div className={s.paperTop}><span>EARLIER INVOICE</span><Icon name="receipt" size={17} /></div><h3>{DEMO_VENDOR}</h3><p className={s.invoiceMeta}>September 1, 2026 · SAMPLE-0901</p><div className={s.itemName}><strong>Whole milk mozzarella</strong><span>SKU CHZ-600 · 6 × 5 lb case</span></div><dl className={s.invoiceFacts}><div><dt>Weight per case</dt><dd>30 lb</dd></div><div><dt>Price per case</dt><dd>$72.00</dd></div><div><dt>Cases ordered</dt><dd>2</dd></div><div className={s.invoiceTotal}><dt>Line total</dt><dd>$144.00</dd></div></dl><span className={s.paperFoot}>FICTIONAL SAMPLE · USD · NO TAX OR FREIGHT</span></article>
              <article className={`${s.invoiceCard} ${s.currentInvoice}`}><div className={s.paperTop}><span>CURRENT INVOICE</span><span className={s.editPill}>Try changing it</span></div><h3>{DEMO_VENDOR}</h3><p className={s.invoiceMeta}>September 8, 2026 · SAMPLE-0908</p><div className={s.itemName}><strong>Whole milk mozzarella</strong><span>SKU CHZ-600 · same product and vendor</span></div><div className={s.invoiceInputs}><label>Weight per case <span><input aria-label="Current case weight in pounds" type="number" min="0.01" step="0.01" value={casePounds} onChange={event => setCasePounds(event.target.value)} /><b>lb</b></span></label><label>Price per case <span><b>$</b><input aria-label="Current case price in dollars" type="number" min="0.01" step="0.01" value={casePrice} onChange={event => setCasePrice(event.target.value)} /></span></label><label>Cases ordered <span><input aria-label="Current cases ordered" type="number" min="0.01" step="1" value={cases} onChange={event => setCases(event.target.value)} /></span></label></div><dl className={s.invoiceFacts}><div className={s.invoiceTotal}><dt>Line total</dt><dd>{invoice ? money(invoice.currentInvoiceTotal) : 'Missing'}</dd></div></dl><span className={s.paperFoot}>FICTIONAL SAMPLE · USD · NO TAX OR FREIGHT</span></article>
            </div>
          </section>}

          {topic === 'labor' && <section aria-label="Sample schedule and time clock inputs">
            <div className={s.coach}><span className={s.coachAvatar}>86</span><p>The schedule ended at 10. The time clock says midnight. That needs a reason. It doesn’t tell us anybody did something wrong.</p></div>
            <div className={s.invoiceGrid}><article className={s.invoiceCard}><div className={s.paperTop}><span>PLANNED SHIFT</span><Icon name="clock" size={17} /></div><h3>Sam · sample employee</h3><p className={s.invoiceMeta}>September 8, 2026 · Fictional schedule</p><div className={s.shiftTime}>4 pm <span>→</span> 10 pm</div><dl className={s.invoiceFacts}><div><dt>Unpaid break</dt><dd>0 min</dd></div><div><dt>Planned paid hours</dt><dd>6 hours</dd></div></dl><p className={s.cardNote}>Both sample records belong to the same employee and shift.</p></article><article className={`${s.invoiceCard} ${s.currentInvoice}`}><div className={s.paperTop}><span>TIME CLOCK</span><span className={s.editPill}>Try changing it</span></div><h3>Sam · sample employee</h3><p className={s.invoiceMeta}>Clocked in September 8, 2026 at 4 pm</p><div className={s.formFields}><label>Clocked out<input type="time" value={actualEnd} onChange={event => setActualEnd(event.target.value)} /></label><label className={s.checkboxLabel}><input type="checkbox" checked={nextDay} onChange={event => setNextDay(event.target.checked)} />Clocked out the next day</label><div className={s.fieldPair}><label>Unpaid break · min<input type="number" min="0" step="1" value={unpaidBreak} onChange={event => setUnpaidBreak(event.target.value)} /></label><label>Hourly wage · optional<input type="number" min="0.01" step="0.01" placeholder="Not provided" value={wage} onChange={event => setWage(event.target.value)} /></label></div></div></article></div>
          </section>}

          {topic === 'pours' && <section aria-label="Sample spirit cost inputs">
            <div className={s.coach}><span className={s.coachAvatar}>86</span><p>One bottle. One house pour. Start with what the spirit costs before mixers, garnish or waste enter the picture.</p></div>
            <article className={`${s.pourCard} ${s.invoiceCard}`}><div className={s.bottleArt} aria-hidden="true"><div className={s.bottleCap} /><div className={s.bottleNeck} /><div className={s.bottleBody}><span>CEDAR<br />& SALT</span><i>HOUSE SPIRIT</i><b>FICTIONAL SAMPLE</b></div><span className={s.bottleShadow} /></div><div className={s.pourInputs}><div className={s.paperTop}><span>YOUR HOUSE POUR</span><span className={s.editPill}>Try 2 ounces</span></div><h3>A small pour change adds up.</h3><p className={s.cardNote}>Change a number. See the spirit cost for one drink.</p><div className={s.formFields}><div className={s.fieldPair}><label>Bottle cost · $<input type="number" min="0.01" step="0.01" value={bottleCost} onChange={event => setBottleCost(event.target.value)} /></label><label>Bottle size · ml<input type="number" min="1" step="1" value={bottleMl} onChange={event => setBottleMl(event.target.value)} /></label></div><label>Standard pour · US fl oz<input type="number" min="0.1" step="0.25" value={pourOz} onChange={event => setPourOz(event.target.value)} /></label></div></div></article>
          </section>}

          {!ready && <p role="status" className={s.inputError}>{topic === 'labor' ? 'Check the clock times and unpaid break. A shift crossing midnight needs “next day” selected.' : 'Add a positive price and quantity to every field. The pour must fit in the bottle.'}</p>}
          {wasChecked && <div ref={resultRef} tabIndex={-1} className={s.result} aria-label="Calculated sample result">
            <div className={s.resultTop}><span><Icon name="check" size={15} />CALCULATED FROM THESE INPUTS</span><strong>Fictional sample</strong></div>
            {!ready ? <p className={s.resultExplanation}>The result will return when the missing or invalid inputs are corrected.</p> : <>
              {topic === 'invoices' && invoice && <><div className={s.resultHeadline}><h2>{Math.abs(invoice.unitDifference) < 0.000001 ? 'Same cost per pound.' : <>This case costs <em>{money(Math.abs(invoice.equivalentCaseDifference))} {invoice.unitDifference > 0 ? 'more' : 'less'}.</em></>}</h2><span className={s.changeBadge}>{invoice.percentChange > 0 ? '+' : ''}{number(invoice.percentChange)}%</span></div><p className={s.resultExplanation}>{money(invoice.previousUnitPrice)}/lb before. {money(invoice.currentUnitPrice)}/lb now. {Math.abs(invoice.unitDifference) < 0.000001 ? 'The comparable unit price matches across these two invoices.' : <>That’s <strong>{money(Math.abs(invoice.currentOrderDifference))} {invoice.unitDifference > 0 ? 'more' : 'less'}</strong> for the {cases} cases on this sample order.</>} This comparison does not establish an invoice error.</p><details className={s.math}><summary>See the math and source records</summary><p>SAMPLE-0901: $72 ÷ 30 lb = $2.40/lb.<br />SAMPLE-0908: {money(Number(casePrice))} ÷ {casePounds} lb = {money(invoice.currentUnitPrice)}/lb.<br />Difference per lb × {casePounds} lb × {cases} cases = {money(invoice.currentOrderDifference)} on the current order.<br />Percent change uses the unrounded unit prices. Same SKU and vendor. Tax and freight excluded.</p></details></>}
              {topic === 'labor' && labor && <><div className={s.resultHeadline}><h2>{labor.differenceMinutes === 0 ? 'The paid hours match.' : <><em>{duration(labor.differenceMinutes)}</em> {labor.differenceMinutes > 0 ? 'beyond the plan.' : 'under the plan.'}</>}</h2><span className={s.changeBadge}>Review the reason</span></div><p className={s.resultExplanation}>{duration(labor.plannedMinutes)} scheduled. {duration(labor.actualMinutes)} on the time clock after recorded unpaid breaks. <strong>{labor.wageDifference === null ? 'Wage cost is missing.' : `${money(Math.abs(labor.wageDifference))} ${labor.wageDifference >= 0 ? 'more' : 'less'} at the supplied hourly wage.`}</strong> A late close, extra prep or a missed punch could explain the difference.</p><details className={s.math}><summary>See the math and limits</summary><p>Scheduled: 16:00 to 22:00, no unpaid break = 360 paid minutes.<br />Actual: 16:00 to {actualEnd}{nextDay ? ' the next day' : ' the same day'}, less {unpaidBreak} unpaid minutes = {labor.actualMinutes} paid minutes.<br />Difference = {labor.differenceMinutes} minutes. {labor.wageDifference === null ? 'No wage has been supplied.' : 'Wage estimate uses straight hourly pay only. Overtime, premiums, taxes and benefits are excluded.'}<br />Fictional records for Sam, September 8, 2026. This is a review prompt, not a payroll calculation or an accusation.</p></details></>}
              {topic === 'pours' && pour && <><div className={s.resultHeadline}><h2><em>{money(pour.costPerPour)}</em> of spirit in every pour.</h2><span className={s.changeBadge}>{pourOz} US fl oz</span></div><p className={s.resultExplanation}>At {money(Number(bottleCost))} per {bottleMl} ml bottle, that’s about {number(pour.theoreticalPours)} theoretical pours. This is the spirit cost only. Your full drink cost also needs mixers, garnish and recorded waste.</p><details className={s.math}><summary>See the math and limits</summary><p>{pourOz} US fl oz × 29.5735295625 = {number(pour.pourMl)} ml per pour.<br />{money(Number(bottleCost))} × {pour.pourMl.toFixed(4)} ml ÷ {bottleMl} ml = {money(pour.costPerPour)} per pour.<br />Fractional pours assume the full bottle is usable. No theft, overpouring or actual consumption has been measured.</p></details></>}
              <div className={s.nextAction}><div><span>ONE NEXT MOVE</span><p>{topic === 'invoices' ? 'Ask the vendor what changed.' : topic === 'labor' ? 'Ask what kept the shift running.' : 'Confirm the pour in your house recipe.'}</p></div><button type="button" className={s.primary} onClick={openDraft}>{topic === 'invoices' ? 'Draft a vendor question' : 'Draft a follow up'}<Icon name="arrow" size={17} /></button></div>
            </>}
          </div>}
          {draft && <section className={s.keptDraft} aria-label="Local sample handoff draft"><span className={s.draftIcon}><Icon name="book" size={22} /></span><div><p className={s.eyebrow}>DRAFT IN THIS TAB · NEVER SENT</p><h3>{draft.title}</h3><p>{draft.owner} · {draft.dueDay.toLowerCase()} at {draft.dueTime}</p><p><strong>Proof to bring back:</strong> {draft.proof}.</p><details><summary>View attached sample evidence</summary><p>{draft.evidence}</p></details></div></section>}
          <footer className={s.footer}>You’re trying the interaction with sample data. Live AI, OCR, accounts and connections are not part of this demo. Reloading clears your draft.</footer>
        </section>
        <aside className={s.context} aria-label="How the operator desk works"><div className={s.contextPaper}><span className={s.contextPin} /><p className={s.eyebrow}>YOU DON’T NEED ANOTHER TO DO LIST.</p><h2>You need the<br /><em>next useful move.</em></h2><ol><li><span>1</span><div><strong>Check the records</strong><p>Show the numbers and where they came from.</p></div></li><li><span>2</span><div><strong>Give one person the job</strong><p>A name. A due time. A clear question.</p></div></li><li><span>3</span><div><strong>Bring back the proof</strong><p>The reply, photo or corrected record.</p></div></li></ol><div className={s.receiptStamp}>KEEP THE RECEIPT<Icon name="check" size={14} /></div></div><div className={s.tryNext}><p className={s.eyebrow}>ALSO ON THE DESK</p>{topics.filter(item => item.id !== topic).map(item => <button type="button" key={item.id} onClick={() => selectTopic(item.id)}><Icon name={item.icon} size={18} /><span>{item.title}<small>{item.detail}</small></span><Icon name="arrow" size={15} /></button>)}</div><p className={s.contextNote}>{completeChecks ? `${completeChecks} of 3 sample checks tried.` : 'Start with the invoices.'}<br />One useful result is enough to begin.</p></aside>
      </main>
    </div>
    {draftOpen && <dialog className={s.dialog} ref={draftDialog} onCancel={() => setDraftOpen(false)} onClick={event => { if (event.target === event.currentTarget) { draftDialog.current?.close(); setDraftOpen(false); } }} aria-labelledby="demo-draft-title"><div className={s.dialogHeading}><div><p className={s.eyebrow}>ONE PERSON. ONE NEXT STEP.</p><h2 id="demo-draft-title">Give this a home.</h2></div><button type="button" aria-label="Close draft" onClick={() => { draftDialog.current?.close(); setDraftOpen(false); }}><Icon name="close" /></button></div><form onSubmit={keepDraft}><p className={s.dialogIntro}>This is a sample handoff. It stays in this tab and is never sent.</p><div className={s.formFields}><label>Who owns the follow up?<select value={owner} onChange={event => setOwner(event.target.value as DemoDraft['owner'])}><option>Alex · sample manager</option><option>Riley · sample owner</option></select></label><div className={s.fieldPair}><label>When is it due?<select value={dueDay} onChange={event => setDueDay(event.target.value)}><option>Next shift</option><option>Tomorrow</option><option>Next delivery</option></select></label><label>At what time?<input required type="time" value={dueTime} onChange={event => setDueTime(event.target.value)} /></label></div></div><div className={s.proofBox}><Icon name="receipt" size={19} /><div><strong>What counts as proof?</strong><p>{topic === 'invoices' ? 'Vendor reply or corrected invoice.' : topic === 'labor' ? 'Manager note explaining the hours, with the time record.' : 'Confirmed recipe and measured pour.'}</p></div></div>{draftKept ? <div role="status" className={s.draftSuccess}><Icon name="check" /><p>Draft kept in this tab. Nothing was sent.</p><button type="button" className={s.primary} onClick={() => { draftDialog.current?.close(); setDraftOpen(false); }}>Back to the desk<Icon name="arrow" size={16} /></button></div> : <button type="submit" className={s.primary}>Keep this demo draft<Icon name="check" size={17} /></button>}</form></dialog>}
  </div>;
}
