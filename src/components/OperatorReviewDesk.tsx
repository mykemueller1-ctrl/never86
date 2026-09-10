'use client';
/* eslint-disable @next/next/no-img-element -- Local blob previews must not be sent through a remote image optimizer. */

import { useEffect, useRef, useState } from 'react';
import type { OperatorReviewData } from '@/lib/operatorReviewTypes';
import { spiritCostPerPour } from '@/lib/operatorReviewTypes';
import styles from './OperatorReviewDesk.module.css';

type View = 'today' | 'invoices' | 'sales' | 'labor' | 'kitchen' | 'bar' | 'files';
type LocalFile = { id: string; name: string; type: string; url?: string };
const navigation: { id: View; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: 'sun' },
  { id: 'invoices', label: 'Invoices', icon: 'receipt' },
  { id: 'sales', label: 'Sales & voids', icon: 'chart' },
  { id: 'labor', label: 'Schedules & labor', icon: 'calendar' },
  { id: 'kitchen', label: 'Kitchen & recipes', icon: 'book' },
  { id: 'bar', label: 'Bar & pours', icon: 'glass' },
  { id: 'files', label: 'Your files', icon: 'folder' },
];
const work = {
  invoices: { eyebrow: 'FOOD COST', title: 'Did the price go up?', intro: 'Start with this week’s invoice. Add an older one from the same vendor when you have it.', needs: ['Current invoice with item lines', 'Earlier invoice for the same products'], checks: ['Match the product and pack size', 'Compare the price per usable unit', 'Show the change next to the original line'], next: 'An invoice photo is enough to start. Price drift needs a comparable earlier invoice.' },
  sales: { eyebrow: 'VOID HUNTER', title: 'What happened on those checks?', intro: 'Bring a week of sales and void reports. We’ll look for the checks worth a second look.', needs: ['Sales and check details for seven matching business days', 'Voids, comps and discounts with check and employee IDs'], checks: ['Keep the check’s server separate from the person who voided it', 'Compare rates against sales and check counts', 'Keep refunds, discounts and business dates straight'], next: 'A sales summary alone cannot show who changed a check. Include the detail report if you have it.' },
  labor: { eyebrow: 'SCHEDULES & LABOR', title: 'Where did the extra hours go?', intro: 'Use the posted schedule and actual punches from the same week.', needs: ['Posted schedule', 'Clock in and clock out entries for those dates'], checks: ['Match the person and shift', 'Handle overnight shifts and unpaid breaks', 'Show extra time before estimating its cost'], next: 'Add pay rates only when you want labor dollars. Hours can be compared first.' },
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const shapes: Record<string, React.ReactNode> = {
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 7h6M9 11h6M9 15h3" /></>,
    chart: <><path d="M4 3v17h17M8 15V9m5 6V5m5 10v-4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 2v6m10-6v6M3 11h18m-13 4h2m4 0h2" /></>,
    book: <><path d="M12 5v16M3 4c4-1 6 0 9 1 3-1 5-2 9-1v15c-4-1-6 0-9 2-3-2-5-3-9-2V4Z" /></>,
    glass: <><path d="M4 3h16l-8 10L4 3Zm8 10v8m-4 0h8" /></>,
    folder: <path d="M3 7V5a2 2 0 0 1 2-2h5l2 4h7a2 2 0 0 1 2 2v10H3V7Z" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name] ?? shapes.folder}</svg>;
}

export function OperatorReviewDesk({ data }: { data: OperatorReviewData }) {
  const [view, setView] = useState<View>('today');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<string | null>(null);
  const [draft, setDraft] = useState(false);
  const [owner, setOwner] = useState('');
  const [due, setDue] = useState('');
  const [savedDraft, setSavedDraft] = useState(false);
  const [bottleCost, setBottleCost] = useState('');
  const [bottleMl, setBottleMl] = useState('750');
  const [pourOz, setPourOz] = useState('1.5');
  const fileInput = useRef<HTMLInputElement>(null);
  const sourceDialog = useRef<HTMLDialogElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const fileUrls = useRef<string[]>([]);
  useEffect(() => () => { fileUrls.current.forEach(url => URL.revokeObjectURL(url)); }, []);
  useEffect(() => {
    if (sourceOpen) sourceDialog.current?.showModal();
    else sourceDialog.current?.close();
  }, [sourceOpen]);

  function closeMenu() { setMenuOpen(false); menuToggle.current?.focus(); }
  function go(next: View) { setView(next); setMenuOpen(false); setSearch(null); setNotice(''); window.scrollTo(0, 0); }
  function previewFiles(list: FileList | null) {
    if (!list) return;
    const accepted: LocalFile[] = [];
    const rejected: string[] = [];
    Array.from(list).forEach((file, i) => {
      if (file.size > 8 * 1024 * 1024 || files.length + accepted.length >= 12) { rejected.push(file.name); return; }
      const type = file.type;
      const url = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(type) ? URL.createObjectURL(file) : undefined;
      if (url) fileUrls.current.push(url);
      accepted.push({ id: `${Date.now()}-${i}`, name: file.name, type, url });
    });
    setFiles(prev => [...prev, ...accepted]);
    setNotice(`${accepted.length} file${accepted.length === 1 ? '' : 's'} opened for this review. OCR and saving to the live seat are not connected.${rejected.length ? ` Could not open: ${rejected.join(', ')}. Maximum 8 MB per file, 12 files.` : ''}`);
    setView('files');
    if (fileInput.current) fileInput.current.value = '';
  }
  function exportReview() {
    const result = { restaurant: data.workspaceName, scope: 'Local UI review only. Not synced to a live restaurant seat.', source: data.source.title, acceptedRules: data.rules.filter(r => confirmed.includes(r.id)), draft: savedDraft ? { title: 'Review kitchen readiness for the next shift', owner, due, status: 'draft, not assigned' } : null };
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'operator-review.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const matches = search ? data.rules.filter(rule => search.toLowerCase().split(/\W+/).filter(w => w.length > 2).some(w => `${rule.title} ${rule.detail}`.toLowerCase().includes(w))) : [];
  const perPour = spiritCostPerPour(Number(bottleCost), Number(bottleMl), Number(pourOz));
  const inputJob = view === 'invoices' || view === 'sales' || view === 'labor' ? work[view] : null;

  return <div className={styles.app} onKeyDown={e => { if (e.key === 'Escape' && menuOpen) closeMenu(); }}>
    <div className={styles.reviewBanner}><span className={styles.reviewDot} />Local review <span className={styles.bannerDetail}>Your workflow is loaded. Live AI, OCR and account sync are not connected.</span><button onClick={exportReview}>Export review <span aria-hidden>↗</span></button></div>
    <aside id="review-workspace-menu" className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
      <button className={styles.sidebarClose} onClick={closeMenu} aria-label="Close workspace menu">Close <Icon name="close" size={18} /></button>
      <a className={styles.brand} href="/operator/review"><span className={styles.brandMark}>86</span><span>Never86<span className={styles.brandApostrophe}>’d</span></span></a>
      <div className={styles.restaurant}><span className={styles.restaurantAvatar}>{data.workspaceName[0]}</span><div><strong>{data.workspaceName}</strong><small>{data.location}</small></div></div>
      <p className={styles.navLabel}>YOUR RESTAURANT</p>
      <nav aria-label="Restaurant workspace">{navigation.map(item => <button key={item.id} onClick={() => go(item.id)} aria-current={view === item.id ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label}</span>{item.id === 'files' ? <b>{files.length + 1}</b> : null}</button>)}</nav>
      <div className={styles.sidebarFoot}><span className={styles.smallAvatar}>M</span><div><strong>Owner workspace</strong><small>Design review</small></div><span className={styles.free}>1 seat</span></div>
    </aside>
    <div className={styles.mainWrap}>
      <header className={styles.topbar}><button ref={menuToggle} className={styles.mobileMenu} aria-label="Toggle workspace menu" aria-controls="review-workspace-menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>☰</button><div><strong>{navigation.find(n => n.id === view)?.label}</strong><span> / {data.workspaceName}</span></div><button className={styles.sourcePill} onClick={() => setSourceOpen(true)}><span /> Workflow loaded <Icon name="book" size={15} /></button></header>
      <div className={styles.body}>
        <main className={styles.main} id="review-main">
          {view === 'today' ? <>
            <div className={styles.eyebrow}>LESS CHASING. MORE RUNNING YOUR RESTAURANT.</div>
            <h1>Let’s take one thing<br />off your plate.</h1>
            <p className={styles.intro}>Start with what’s in front of you. An invoice, a messy shift,<br className={styles.desktopBreak} /> or a number that doesn’t look right.</p>
            <div className={styles.jobGrid}>
              <button className={styles.jobCard} onClick={() => go('invoices')}><span className={`${styles.jobIcon} ${styles.gold}`}><Icon name="receipt" size={23} /></span><strong>Check an invoice</strong><span>See what changed in your food costs.</span><b>Bring one invoice <Icon name="arrow" size={17} /></b></button>
              <button className={styles.jobCard} onClick={() => go('sales')}><span className={`${styles.jobIcon} ${styles.blue}`}><Icon name="chart" size={23} /></span><strong>Look at my voids</strong><span>Find the checks worth a second look.</span><b>Bring last week’s reports <Icon name="arrow" size={17} /></b></button>
              <button className={styles.jobCard} onClick={() => go('kitchen')}><span className={`${styles.jobIcon} ${styles.green}`}><Icon name="book" size={23} /></span><strong>Get the next shift ready</strong><span>Use the kitchen workflow you already built.</span><b>Review your workflow <Icon name="arrow" size={17} /></b></button>
            </div>
            <section className={styles.continueCard} aria-label="Continue with your workflow"><div className={styles.continueIcon}><Icon name="check" size={24} /></div><div><p className={styles.eyebrow}>WE CAN START HERE</p><h2>Your kitchen knowledge is here.</h2><p>{data.rules.length} operating rules from {data.source.label.toLowerCase()}. Review them once so the next shift starts with the same playbook.</p><button onClick={() => go('kitchen')}>Review the {data.rules.length} rules <Icon name="arrow" size={17} /></button></div><span className={styles.documentBadge}><Icon name="book" size={23} /><span>SOURCE</span></span></section>
            <div className={styles.quietLinks}><span>Something else on your mind?</span><button onClick={() => go('labor')}>Extra labor hours</button><button onClick={() => go('bar')}>Drink costs</button></div>
          </> : null}

          {inputJob ? <>
            <p className={styles.eyebrow}>{inputJob.eyebrow}</p><h1>{inputJob.title}</h1><p className={styles.intro}>{inputJob.intro}</p>
            <section className={styles.uploadCard}><span className={styles.uploadIcon}><Icon name="plus" size={26} /></span><h2>Bring what you have.</h2><p>Photos, PDFs, spreadsheets and reports.</p><button className={styles.primary} onClick={() => fileInput.current?.click()}>Choose a file or photo <Icon name="plus" size={18} /></button><small>Local file preview works. Extraction is not connected yet.</small></section>
            <div className={styles.twoColumns}><section className={styles.plainCard}><h3>What we need</h3>{inputJob.needs.map((n, i) => <p key={n}><span className={styles.number}>{i + 1}</span>{n}</p>)}</section><section className={styles.plainCard}><h3>What the check will do</h3>{inputJob.checks.map(n => <p key={n}><Icon name="check" size={17} />{n}</p>)}</section></div><p className={styles.note}>{inputJob.next}</p>
          </> : null}

          {view === 'kitchen' ? <>
            <p className={styles.eyebrow}>YOUR KITCHEN, YOUR WAY</p><h1>A good shift shouldn’t<br />depend on who’s working.</h1><p className={styles.intro}>These rules came from your workflow document. Check what’s still right. Keep a copy of this review when you’re done.</p>
            <div className={styles.ruleProgress}><strong>{confirmed.length} of {data.rules.length} reviewed</strong><span>Changes stay in this page until exported</span></div>
            <div className={styles.rules}>{data.rules.map(rule => <label key={rule.id} className={`${styles.rule} ${confirmed.includes(rule.id) ? styles.ruleChecked : ''}`}><input type="checkbox" checked={confirmed.includes(rule.id)} onChange={e => setConfirmed(prev => e.target.checked ? [...prev, rule.id] : prev.filter(id => id !== rule.id))} /><div><strong>{rule.title}</strong><p>{rule.detail}</p><button type="button" onClick={e => { e.preventDefault(); setSourceOpen(true); }}>{rule.section} <span aria-hidden>↗</span></button></div></label>)}</div>
            <section className={styles.actionCard}><div><p className={styles.eyebrow}>ONE NEXT ACTION</p><h2>Make the handoff clear.</h2><p>One owner. One due time. One way to check it happened.</p></div><button className={styles.primary} onClick={() => setDraft(!draft)}>Draft a handoff <Icon name="arrow" size={17} /></button></section>
            {draft ? <form className={styles.draftForm} onSubmit={e => { e.preventDefault(); setSavedDraft(true); }}><h3>Review kitchen readiness for the next shift</h3><label>Who owns this?<input required value={owner} onChange={e => { setOwner(e.target.value); setSavedDraft(false); }} placeholder="Name" /></label><label>When is it due?<input required type="datetime-local" value={due} onChange={e => { setDue(e.target.value); setSavedDraft(false); }} /></label><p>Proof: a station photo and a note about anything still missing.</p><button className={styles.primary} type="submit">Keep this draft</button>{savedDraft ? <p role="status" className={styles.success}>Draft ready for {owner}. Export the review to keep it. No assignment or message has been sent.</p> : null}</form> : null}
          </> : null}

          {view === 'bar' ? <>
            <p className={styles.eyebrow}>BAR & POURS</p><h1>What does that pour<br />actually cost?</h1><p className={styles.intro}>Start with one bottle and your standard pour. Add recipes and counts when you’re ready to check usage.</p>
            <section className={styles.calculator}><div><h2>Check one spirit</h2><p>Enter your own numbers. The bottle size and pour below are editable starting values.</p><div className={styles.calcInputs}><label>Bottle cost ($)<input type="number" min="0.01" step="0.01" inputMode="decimal" value={bottleCost} onChange={e => setBottleCost(e.target.value)} placeholder="Enter cost" /></label><label>Bottle size (ml)<input type="number" min="1" value={bottleMl} onChange={e => setBottleMl(e.target.value)} /></label><label>Pour (US fl oz)<input type="number" min="0.1" step="0.25" value={pourOz} onChange={e => setPourOz(e.target.value)} /></label></div></div><div className={styles.calcResult}><span>SPIRIT COST PER POUR</span><strong>{perPour === null ? '—' : perPour.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</strong><p>{perPour === null ? 'Add the bottle cost to calculate.' : 'Calculated from your inputs. Mixers, garnish and waste are extra.'}</p></div></section>
            <section className={styles.plainCard}><h3>To check where the liquor went</h3><p><Icon name="check" />Drink sales + recipes = expected usage</p><p><Icon name="check" />Starting count + deliveries − ending count = actual usage, before transfer adjustments</p><p><Icon name="check" />Account for transfers, recorded waste and comps before flagging an unexplained difference</p><p className={styles.note}>A difference needs review. Shared inventory cannot identify a particular bartender.</p></section><button className={styles.secondary} onClick={() => fileInput.current?.click()}>Open a recipe photo <Icon name="plus" size={18} /></button>
          </> : null}

          {view === 'files' ? <>
            <p className={styles.eyebrow}>THE PAPER BEHIND THE ANSWER</p><h1>Your files. Easy to find.</h1><p className={styles.intro}>Open a source, see what it contains, and keep unread files separate from usable evidence.</p><button className={styles.primary} onClick={() => fileInput.current?.click()}>Open files or photos <Icon name="plus" size={18} /></button>
            <div className={styles.fileGrid}><button className={styles.sourceFile} onClick={() => setSourceOpen(true)}><span className={styles.paperPreview}><b>{data.workspaceName}</b><strong>Workflow &<br />operating rules</strong><i /><i /><i /><span>{data.source.label}</span></span><strong>{data.source.title}</strong><small>Text loaded · rules awaiting review</small></button>{files.map(file => <article key={file.id} className={styles.fileCard}>{file.url ? <a href={file.url} target="_blank" rel="noreferrer"><img src={file.url} alt={`Original preview: ${file.name}`} /></a> : <div className={styles.filePlaceholder}><Icon name="receipt" size={40} /></div>}<strong>{file.name}</strong><small>Opened locally · not extracted</small></article>)}</div>
          </> : null}

          {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
          {search !== null ? <section className={styles.searchResults} aria-live="polite"><h3>From your workflow: “{search}”</h3>{matches.length ? matches.map(rule => <article key={rule.id}><strong>{rule.title}</strong><p>{rule.detail}</p><button onClick={() => setSourceOpen(true)}>{rule.section} ↗</button></article>) : <p>No matching rule in this review. Try “invoice”, “shift”, “category” or “week”. This search reads the imported rules; live AI isn’t connected.</p>}</section> : null}
          <form className={styles.composer} onSubmit={e => { e.preventDefault(); if (query.trim()) { setSearch(query.trim()); setQuery(''); } }}><label htmlFor="review-query">Find something in your workflow</label><div><button type="button" aria-label="Open a file or photo" onClick={() => fileInput.current?.click()}><Icon name="plus" /></button><input id="review-query" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try “How do we handle mixed invoices?”" maxLength={500} /><button type="submit" disabled={!query.trim()} aria-label="Search workflow"><Icon name="arrow" /></button></div><small>Source search works in this review. Ask freely when live AI is connected.</small></form>
          <footer className={styles.footer}>Built by Myke Mueller. For the people wearing too many hats.</footer>
        </main>
        <aside className={styles.context} aria-label="Workspace context"><p className={styles.eyebrow}>ALREADY ON YOUR DESK</p><div className={styles.contextPaper}><Icon name="book" size={25} /><h3>Your kitchen workflow</h3><p>{data.source.label} is loaded. The original text is one click away.</p><button onClick={() => setSourceOpen(true)}>Open source <Icon name="arrow" size={16} /></button></div><div className={styles.contextStatus}><h3>What’s here</h3><p><span className={styles.dotGreen} />Operating rules<span>{data.rules.length}</span></p><p><span className={styles.dotGray} />Sales reports<span>Not loaded</span></p><p><span className={styles.dotGray} />Invoices<span>Not loaded</span></p><p><span className={styles.dotGray} />Inventory counts<span>Not loaded</span></p></div><div className={styles.coachNote}><span>FROM ONE OPERATOR TO ANOTHER</span><p>You don’t need to organize everything first. Start with the thing that’s costing you time today.</p><strong>Built around Myke’s approach</strong></div><button className={styles.exportLink} onClick={exportReview}>Export this review ↗</button></aside>
      </div>
    </div>
    <input ref={fileInput} type="file" multiple accept="image/*,.pdf,.csv,.xlsx,.xls,.txt,.docx" hidden onChange={e => previewFiles(e.target.files)} />
    <dialog className={styles.sourceDialog} ref={sourceDialog} onCancel={() => setSourceOpen(false)} onClick={e => { if (e.target === sourceDialog.current) setSourceOpen(false); }}><div className={styles.dialogHeader}><div><span>{data.source.label}</span><h2>{data.source.title}</h2></div><button aria-label="Close source" onClick={() => setSourceOpen(false)}><Icon name="close" /></button></div><p className={styles.sourceNote}>Extracted from the document you supplied. Statements are source material, not confirmation that every rule is current.</p><pre>{data.source.text}</pre></dialog>
  </div>;
}
