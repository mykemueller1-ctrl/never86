'use client';

/**
 * Public Action Shift door on never86.ai.
 * One owner, one seat. Sample chain only:
 * mozzarella $48 to $56, $8 a case, 40 pizzas a case (sample), $0.20 a pizza, 385 sold, $77 a week.
 * /legacy and /legacy/try stay routed. This page does not link them.
 */
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import {
  ArrowUp,
  BarChart3,
  BookOpen,
  CircleAlert,
  Clock,
  FolderOpen,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Receipt,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import styles from './action-shift-morning.module.css';

export const ACTION_SHIFT_APP_URL = 'https://app.never86.app';

/** /try sample values. $8 is $56 − $48. $0.20 is $8 / 40 pizzas a case (sample). $77 is 385 × $0.20. */
export const ACTION_SHIFT_SAMPLE = {
  label: 'Sample',
  item: 'Mozzarella',
  priorCase: 48,
  currentCase: 56,
  pizzasPerCase: 40,
  perPizza: 0.2,
  sold: 385,
  week: 77,
} as const;

export const ACTION_SHIFT_CASE_DELTA =
  ACTION_SHIFT_SAMPLE.currentCase - ACTION_SHIFT_SAMPLE.priorCase;

const MOVE = 'Call your cheese rep, or change the pizza price.';

const NAV = [
  { id: 'desk', label: 'Owner desk', icon: LayoutDashboard },
  { id: 'ask', label: 'Ask', icon: MessageSquare },
  { id: 'sales', label: 'Sales reports', icon: BarChart3 },
  { id: 'labor', label: 'Labor', icon: Clock },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'recipes', label: 'Recipe cards', icon: UtensilsCrossed },
  { id: 'knowledge', label: 'Restaurant knowledge', icon: BookOpen },
  { id: 'actions', label: 'My actions', icon: ListChecks, keep: true },
  { id: 'night', label: 'Night proof', icon: ClipboardCheck },
  { id: 'missing', label: "What's missing", icon: CircleAlert },
  { id: 'files', label: 'All files', icon: FolderOpen },
] as const;

type SectionId = (typeof NAV)[number]['id'];

type Props = {
  page?: 'home' | 'try';
};

function Unit({ value, cents = false }: { value: number; cents?: boolean }) {
  const shown = cents ? value.toFixed(2) : String(value);
  return <span className={styles.unit}>{`$${shown}`}</span>;
}

function sampleAnswer() {
  const sample = ACTION_SHIFT_SAMPLE;
  return `${sample.item} went from $${sample.priorCase} to $${sample.currentCase} a case. 40 pizzas a case (sample). That is $${ACTION_SHIFT_CASE_DELTA} a case, $${sample.perPizza.toFixed(2)} a pizza. You sold ${sample.sold}. That is $${sample.week} this week. Example data.`;
}

function answerFor(question: string) {
  const q = question.toLowerCase();
  if (!q.trim() || /(cheese|mozz|pizza|invoice|price|case|morning)/.test(q)) {
    return sampleAnswer();
  }
  if (/(labor|hour|schedule|clock|wage)/.test(q)) {
    return 'This example does not include a time clock, so hours stay Missing.';
  }
  return "I don't have that yet.";
}

function Tag({ label, note }: { label: 'Sample' | 'Missing' | 'Done'; note?: string }) {
  const tone =
    label === 'Sample' ? styles.tagSample : label === 'Done' ? styles.tagDone : styles.tagMissing;
  return (
    <span className={`${styles.tag} ${tone}`}>
      {label}
      {note ? <small>{note}</small> : null}
    </span>
  );
}

function RailIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon size={16} strokeWidth={1.5} aria-hidden="true" />;
}

const MISSING = [
  'No time clock in this example.',
  'No wage on file.',
  'No menu price in this example.',
  'No close for last night. The week stays open.',
];

function MissingTable() {
  return (
    <table className={styles.sheet}>
      <tbody>
        {MISSING.map((line) => (
          <tr key={line}>
            <th scope="row">
              <Tag label="Missing" />
            </th>
            <td>{line}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ActionShiftMorning({ page = 'home' }: Props) {
  const sample = ACTION_SHIFT_SAMPLE;
  const [section, setSection] = useState<SectionId>('desk');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(sampleAnswer);
  const [actionState, setActionState] = useState<'open' | 'done' | 'skipped'>('open');
  const [category, setCategory] = useState<'All' | 'Food' | 'Beer' | 'Liquor' | 'Wine'>('All');

  function onAsk(event: FormEvent) {
    event.preventDefault();
    setAnswer(answerFor(question));
  }

  const showCheese = category === 'All' || category === 'Food';
  const outcome =
    actionState === 'open' ? 'Awaiting outcome' : actionState === 'done' ? 'Done' : 'Not doing';

  return (
    <div className={styles.seat} data-section={section}>
      <aside>
        <p className={styles.brand}>Action Shift</p>
        <p className={styles.place}>Example seat</p>
        <p className={styles.owner}>One owner · Free</p>
        <nav aria-label="Owner seat">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              data-keep={'keep' in item && item.keep ? '' : undefined}
              aria-current={section === item.id ? 'page' : undefined}
              onClick={() => setSection(item.id)}
            >
              <RailIcon icon={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main>
        {page === 'home' ? (
          <header className={styles.hero}>
            <h1>Find the leak. Assign the fix. Keep the receipt.</h1>
            <p className={styles.lede}>
              Last night&apos;s close, turned into one move. One product. One owner. One receipt.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primary} href="/onboard">
                Start my free seat
              </Link>
              <a className={styles.secondary} href="#morning">
                See a sample morning
              </a>
            </div>
          </header>
        ) : null}

        <p className={styles.banner} role="status">
          Example data
        </p>

        <article id="morning" data-panel="desk">
          <p className={styles.stepLabel}>Morning · {sample.label}</p>
          {page === 'try' ? <h1>Here&apos;s a sample morning.</h1> : <h2>One thing to get ahead of</h2>}
          <p className={styles.move}>{MOVE}</p>
          <table className={styles.sheet}>
            <tbody>
              <tr>
                <th scope="row">Item</th>
                <td>{sample.item}</td>
              </tr>
              <tr>
                <th scope="row">Was</th>
                <td><Unit value={sample.priorCase} /></td>
              </tr>
              <tr>
                <th scope="row">Now</th>
                <td><Unit value={sample.currentCase} /></td>
              </tr>
              <tr>
                <th scope="row">A case</th>
                <td><Unit value={ACTION_SHIFT_CASE_DELTA} /></td>
              </tr>
              <tr>
                <th scope="row">A pizza</th>
                <td><Unit value={sample.perPizza} cents /></td>
              </tr>
              <tr>
                <th scope="row">Sold</th>
                <td>{sample.sold}</td>
              </tr>
              <tr>
                <th scope="row">This week</th>
                <td><Unit value={sample.week} /></td>
              </tr>
              <tr>
                <th scope="row">Yield</th>
                <td>40 pizzas a case (sample)</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.why}>
            {sample.item} went from <Unit value={sample.priorCase} /> to <Unit value={sample.currentCase} /> a case.
            {' '}40 pizzas a case (sample). That is <Unit value={ACTION_SHIFT_CASE_DELTA} /> a case,{' '}
            <Unit value={sample.perPizza} cents /> a pizza. You sold {sample.sold}. That is <Unit value={sample.week} /> this week.
          </p>
          <p className={styles.money}>
            <Tag label="Sample" note="Example data" />
          </p>
          <p className={styles.note}>Week stays open. This example has the cheese invoice and no nightly close.</p>
          <p className={styles.note}>
            Night proof is the next invoice, or the menu price. Saying the move is done does not close the week.
          </p>
          <div className={styles.mobileMissing}>
            <h2>What&apos;s missing</h2>
            <MissingTable />
          </div>
        </article>

        <article data-panel="ask">
          <h2>Ask</h2>
          <table className={styles.sheet}>
            <tbody>
              <tr>
                <th scope="row">Question</th>
                <td>What changed on the cheese?</td>
              </tr>
              <tr>
                <th scope="row">Answer</th>
                <td>{answer}</td>
              </tr>
            </tbody>
          </table>
          <form className={styles.composer} onSubmit={onAsk}>
            <label className={styles.sr} htmlFor="ask-box">
              Ask about this example
            </label>
            <input
              id="ask-box"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about this example"
            />
            <button type="submit" className={styles.send} aria-label="Send">
              <ArrowUp size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </form>
        </article>

        <article data-panel="sales">
          <h2>Sales reports</h2>
          <p>
            {sample.sold} pizzas sold in this example. There is no close report here, so a sales total stays Missing.
          </p>
          <table className={styles.sheet}>
            <tbody>
              <tr>
                <th scope="row">Pizzas sold</th>
                <td>{sample.sold}</td>
              </tr>
              <tr>
                <th scope="row">Sales total</th>
                <td>
                  <Tag label="Missing" note="No close in this example" />
                </td>
              </tr>
            </tbody>
          </table>
          <p>No close file is in this example.</p>
        </article>

        <article data-panel="labor" data-section="labor">
          <h2>Labor</h2>
          <p className={styles.stepLabel}>Labor · {sample.label}</p>
          <h3>The schedule and the clock.</h3>
          <p>
            On your seat, this compares the schedule with who clocked in. This sample
            does not show a labor amount. The one move stays the cheese.
          </p>
          <table className={styles.sheet}>
            <tbody>
              <tr>
                <th scope="row">Hours</th>
                <td>
                  <Tag label="Missing" />
                  <span>No time clock in this example.</span>
                </td>
              </tr>
            </tbody>
          </table>
        </article>

        <article id="invoices" data-panel="invoices">
          <h2>Invoices</h2>
          <div className={styles.filters} aria-label="Invoice category">
            {(['All', 'Food', 'Beer', 'Liquor', 'Wine'] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {showCheese ? (
            <>
              <p className={styles.stepLabel}>Invoices · {sample.label}</p>
              <h3>Same cheese. Higher price.</h3>
              <p>The same mozzarella case costs more than last time.</p>
              <table className={styles.sheet}>
                <tbody>
                  <tr>
                    <th scope="row">Item</th>
                    <td>{sample.item}</td>
                  </tr>
                  <tr>
                    <th scope="row">Was</th>
                    <td><Unit value={sample.priorCase} /></td>
                  </tr>
                  <tr>
                    <th scope="row">Now</th>
                    <td><Unit value={sample.currentCase} /></td>
                  </tr>
                </tbody>
              </table>
              <p className={styles.money}>
                <Tag label="Sample" note="Example data" />
              </p>
            </>
          ) : (
            <p>No invoices in this filter.</p>
          )}
        </article>

        <article data-panel="recipes">
          <h2>Recipe cards</h2>
          <p className={styles.stepLabel}>Menu · {sample.label}</p>
          <h3>Twenty cents more on a pizza.</h3>
          <p>
            The higher case price adds <Unit value={sample.perPizza} cents /> to each pizza.
            40 pizzas a case (sample).
          </p>
          <table className={styles.sheet}>
            <tbody>
              <tr>
                <th scope="row">A pizza</th>
                <td><Unit value={sample.perPizza} cents /></td>
              </tr>
              <tr>
                <th scope="row">Plate cost</th>
                <td>
                  <Tag label="Missing" />
                  <span>No menu price in this example, so plate cost stays Missing.</span>
                </td>
              </tr>
            </tbody>
          </table>
        </article>

        <article data-panel="knowledge">
          <h2>Restaurant knowledge</h2>
          <table className={styles.sheet}>
            <tbody>
              <tr>
                <th scope="row">Seat</th>
                <td>
                  One product. One owner. One restaurant. The first seat is free.
                  <span className={styles.source}>Source: example</span>
                </td>
              </tr>
              <tr>
                <th scope="row">Price</th>
                <td>
                  A price change is something to check. The cash is still in the same drawer.
                  <span className={styles.source}>Source: example</span>
                </td>
              </tr>
            </tbody>
          </table>
        </article>

        <article id="actions" data-panel="actions">
          <h2>My actions</h2>
          <table className={styles.sheet}>
            <tbody>
              <tr>
                <th scope="row">Move</th>
                <td>{MOVE}</td>
              </tr>
              <tr>
                <th scope="row">Owner</th>
                <td>
                  Owner: Owner · {actionState === 'done' ? <Tag label="Done" /> : outcome}
                </td>
              </tr>
            </tbody>
          </table>
          <p className={styles.money}>
            <Tag label="Sample" note="Example data" />
          </p>
          <div className={styles.actions}>
            <button type="button" onClick={() => setActionState('done')}>
              Done
            </button>
            <button type="button" onClick={() => setActionState('skipped')}>
              Not doing
            </button>
          </div>
        </article>

        <article id="night" data-panel="night">
          <h2>Night proof</h2>
          <p className={styles.stepLabel}>Night · {sample.label}</p>
          <h3>The receipt for the morning move.</h3>
          <p>
            Proof is the next cheese invoice, or the menu price. A spoken yes does not write a new dollar.
          </p>
          <table className={styles.sheet}>
            <tbody>
              <tr>
                <th scope="row">Proof</th>
                <td>Next invoice, or the menu price.</td>
              </tr>
              <tr>
                <th scope="row">Week</th>
                <td>Stays open. This example has no nightly close.</td>
              </tr>
            </tbody>
          </table>
        </article>

        <article data-panel="missing">
          <h2>What&apos;s missing</h2>
          <MissingTable />
        </article>

        <article data-panel="files">
          <h2>All files</h2>
          <table className={styles.sheet}>
            <tbody>
              <tr>
                <th scope="row">File</th>
                <td>
                  Invoices · sample-invoice.pdf
                  <Tag label="Sample" note="Example data" />
                </td>
              </tr>
            </tbody>
          </table>
          <p>No other files are in this example.</p>
        </article>

        <footer className={styles.footer}>
          <p>
            {sample.label} only. Example data. A sample price change, not money you got back.
            One product. One restaurant. One seat. Free.
            ChatGPT, Gemini, and Grok open this seat.
          </p>
          <nav aria-label="Footer">
            <a href={ACTION_SHIFT_APP_URL}>app.never86.app</a>
            <Link href="/onboard">Start my free seat</Link>
            <Link href="/llm-shells">ChatGPT, Gemini, Grok</Link>
          </nav>
        </footer>
      </main>
    </div>
  );
}
