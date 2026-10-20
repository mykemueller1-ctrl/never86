'use client';

/**
 * Public Action Shift door on never86.ai.
 * Looks like the one-owner CTAP seat: one rail, one pane.
 * Sample chain only: mozzarella $48 to $56, $0.20 per pizza, 385 sold, $77 a week.
 * Previous homepage: /legacy. Previous /try: /legacy/try.
 */
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import styles from './action-shift-morning.module.css';

export const ACTION_SHIFT_APP_URL = 'https://app.never86.app';
export const ACTION_SHIFT_CONTACT = 'myke@never86.app';

/** /try sample values. $8 is $56 − $48. $77 is 385 × $0.20. */
export const ACTION_SHIFT_SAMPLE = {
  label: 'Sample',
  item: 'Mozzarella',
  priorCase: 48,
  currentCase: 56,
  perPizza: 0.2,
  sold: 385,
  week: 77,
} as const;

export const ACTION_SHIFT_CASE_DELTA =
  ACTION_SHIFT_SAMPLE.currentCase - ACTION_SHIFT_SAMPLE.priorCase;

const MOVE = 'Call your cheese rep, or change the pizza price.';

const NAV = [
  { id: 'desk', label: 'Owner desk' },
  { id: 'ask', label: 'Ask' },
  { id: 'sales', label: 'Sales reports' },
  { id: 'labor', label: 'Labor' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'recipes', label: 'Recipe cards' },
  { id: 'knowledge', label: 'Restaurant knowledge' },
  { id: 'actions', label: 'My actions' },
  { id: 'missing', label: "What's missing" },
  { id: 'files', label: 'All files' },
] as const;

type SectionId = (typeof NAV)[number]['id'];

type Props = {
  page?: 'home' | 'try';
};

function sampleAnswer() {
  const sample = ACTION_SHIFT_SAMPLE;
  return `${sample.item} went from $${sample.priorCase} to $${sample.currentCase} a case. That is $${sample.perPizza.toFixed(2)} more on each pizza. You sold ${sample.sold}. That is $${sample.week} more this week. Example data.`;
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

function Chip({ label, note }: { label: 'Sample' | 'Missing'; note?: string }) {
  const tone = label === 'Sample' ? styles.chipSample : styles.chipMissing;
  return (
    <span className={`${styles.chip} ${tone}`}>
      {label}
      {note ? <small>{note}</small> : null}
    </span>
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

  return (
    <div className={styles.seat}>
      <a className={styles.skip} href="#morning">
        Skip to the morning card
      </a>
      <aside>
        <p className={styles.brand}>Action Shift</p>
        <p className={styles.place}>Example seat</p>
        <p className={styles.owner}>One owner · Free</p>
        <nav aria-label="Owner seat">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={section === item.id ? 'page' : undefined}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <p className={styles.contact}>
          <a href={`mailto:${ACTION_SHIFT_CONTACT}`}>{ACTION_SHIFT_CONTACT}</a>
        </p>
      </aside>
      <main>
        <p className={styles.banner} role="status">
          Example data
        </p>
        <p className={styles.kicker}>Money, leaks, owner actions</p>

        <article id="morning" hidden={section !== 'desk'}>
          <p className={styles.stepLabel}>Morning · {sample.label}</p>
          <h1>{page === 'try' ? 'Four steps. Then one move.' : 'One move every morning.'}</h1>
          <p className={styles.lede}>
            {page === 'try'
              ? 'This is a sample restaurant. Invoices, then the menu, then sales, then one thing to do in the morning.'
              : 'Action Shift turns yesterday into one thing to do. One restaurant. One seat. Free.'}
          </p>
          <h2>One thing to get ahead of</h2>
          <p className={styles.move}>{MOVE}</p>
          <p className={styles.why}>
            {sample.item} went from ${sample.priorCase} to ${sample.currentCase} a case.
            That is ${sample.perPizza.toFixed(2)} more on each pizza. You sold {sample.sold}.
            That is ${sample.week} more this week.
          </p>
          <p className={styles.money}>
            <strong>${sample.week}</strong>
            <Chip label="Sample" note="Example data" />
          </p>
          <p className={styles.delta}>Up ${ACTION_SHIFT_CASE_DELTA} a case</p>
          <p className={styles.note}>Week stays open. This example has the cheese invoice and no nightly close.</p>
        </article>

        <article hidden={section !== 'ask'}>
          <h2>Ask</h2>
          <div className={styles.thread}>
            <p className={styles.bubble}>What changed on the cheese?</p>
            <p className={styles.answer}>{answer}</p>
          </div>
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
              ↑
            </button>
          </form>
        </article>

        <article hidden={section !== 'sales'}>
          <h2>Sales reports</h2>
          <p>
            {sample.sold} pizzas sold in this example. There is no close report here, so a sales total stays Missing.
          </p>
          <p className={styles.money}>
            <Chip label="Missing" note="No close in this example" />
          </p>
          <p>No close file is in this example.</p>
        </article>

        <article data-section="labor" hidden={section !== 'labor'}>
          <h2>Labor</h2>
          <p className={styles.stepLabel}>Labor · {sample.label}</p>
          <h3>The schedule and the clock.</h3>
          <p>
            On your seat, this compares the schedule with who clocked in. This sample
            does not show a labor amount. The one move stays the cheese.
          </p>
          <p className={styles.money}>
            <Chip label="Missing" />
            <span>No time clock in this example.</span>
          </p>
        </article>

        <article id="invoices" hidden={section !== 'invoices'}>
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
              <div className={styles.prices}>
                <div>
                  <small>Was</small>
                  <b>${sample.priorCase}</b>
                </div>
                <span aria-hidden="true">→</span>
                <div>
                  <small>Now</small>
                  <b>${sample.currentCase}</b>
                </div>
              </div>
              <p className={styles.money}>
                <Chip label="Sample" note="Example data" />
              </p>
            </>
          ) : (
            <p>No invoices in this filter.</p>
          )}
        </article>

        <article hidden={section !== 'recipes'}>
          <h2>Recipe cards</h2>
          <p className={styles.stepLabel}>Menu · {sample.label}</p>
          <h3>Twenty cents more on a pizza.</h3>
          <p>The higher case price adds ${sample.perPizza.toFixed(2)} to each pizza.</p>
          <p className={styles.money}>
            <strong>${sample.perPizza.toFixed(2)}</strong>
            <Chip label="Sample" note="Example data" />
          </p>
          <p className={styles.money}>
            <Chip label="Missing" />
            <span>No menu price in this example, so plate cost stays Missing.</span>
          </p>
        </article>

        <article hidden={section !== 'knowledge'}>
          <h2>Restaurant knowledge</h2>
          <ul>
            <li>
              One owner. One restaurant. The first seat is free.
              <span className={styles.source}>Source: example</span>
            </li>
            <li>
              A price change is something to check, not money recovered.
              <span className={styles.source}>Source: example</span>
            </li>
          </ul>
        </article>

        <article hidden={section !== 'actions'}>
          <h2>My actions</h2>
          <p>{MOVE}</p>
          <p>
            Owner: Owner · {actionState === 'open' ? 'Awaiting outcome' : actionState === 'done' ? 'Done' : 'Not doing'}
          </p>
          <p className={styles.money}>
            <Chip label="Sample" note="Example data" />
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

        <article hidden={section !== 'missing'}>
          <h2>What&apos;s missing</h2>
          <ul>
            <li>No time clock in this example. Upload a time-clock report on your own seat.</li>
            <li>No wage on file. Enter the wage before a labor amount.</li>
            <li>No menu price in this example. Add the plate price before a plate cost.</li>
            <li>No nightly close in this example. The week stays open.</li>
          </ul>
        </article>

        <article hidden={section !== 'files'}>
          <h2>All files</h2>
          <ul>
            <li>
              Invoices · sample-invoice.pdf
              <Chip label="Sample" note="Example data" />
            </li>
          </ul>
          <p>No other files are in this example.</p>
        </article>

        <footer className={styles.footer}>
          <p>
            {sample.label} only. Example data. A sample price change, not money you got back.
            One restaurant. One seat. Free.
          </p>
          <nav aria-label="Footer">
            <a href={ACTION_SHIFT_APP_URL}>app.never86.app</a>
            <Link href="/contact">Claim the free seat</Link>
            <a href={`mailto:${ACTION_SHIFT_CONTACT}`}>{ACTION_SHIFT_CONTACT}</a>
            <Link href="/legacy">Previous homepage</Link>
            <Link href="/legacy/try">Previous try page</Link>
          </nav>
        </footer>
      </main>
    </div>
  );
}
