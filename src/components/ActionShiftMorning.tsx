/**
 * Public Action Shift door on never86.ai.
 * Sample chain only: mozzarella $48 to $56, $0.20 per pizza, 385 sold, $77 a week.
 * Previous homepage: /legacy. Previous /try: /legacy/try.
 */
import Link from 'next/link';
import styles from './action-shift-morning.module.css';

export const ACTION_SHIFT_APP_URL = 'https://app.never86.app';

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

type Props = {
  page?: 'home' | 'try';
};

export function ActionShiftMorning({ page = 'home' }: Props) {
  const sample = ACTION_SHIFT_SAMPLE;
  return (
    <main className={styles.page}>
      <a className={styles.skip} href="#morning">
        Skip to the morning card
      </a>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/">
            Never86<span>&apos;d</span>
          </Link>
          <p className={styles.product}>Action Shift</p>
          <a className={styles.primary} href={ACTION_SHIFT_APP_URL}>
            Open the app
          </a>
        </header>

        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>One seat · Free</p>
            <h1 className={page === 'try' ? styles.tryTitle : undefined}>
              {page === 'try' ? 'Four steps. Then one move.' : 'One move every morning.'}
            </h1>
            <p className={styles.lede}>
              {page === 'try'
                ? 'This is a sample restaurant. Invoices, then the menu, then sales, then one thing to do in the morning.'
                : 'Action Shift turns yesterday into one thing to do. One restaurant. One seat. Free.'}
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primary} href={ACTION_SHIFT_APP_URL}>
                Open the app
              </a>
              <a className={styles.textLink} href="#invoices">
                See the four steps
              </a>
            </div>
          </div>

          <article className={styles.card} id="morning" aria-labelledby="morning-title">
            <div className={styles.cardTop}>
              <p>Morning</p>
              <p className={styles.sample}>{sample.label}</p>
            </div>
            <h2 id="morning-title">One thing to get ahead of</h2>
            <p className={styles.move}>{MOVE}</p>
            <p className={styles.why}>
              {sample.item} went from ${sample.priorCase} to ${sample.currentCase} a case.
              That is ${sample.perPizza.toFixed(2)} more on each pizza. You sold {sample.sold}.
              That is ${sample.week} more this week.
            </p>
            <div className={styles.figure}>
              <div>
                <small>This week · {sample.label}</small>
                <strong>${sample.week}</strong>
              </div>
              <p>Up ${ACTION_SHIFT_CASE_DELTA} a case</p>
            </div>
          </article>
        </section>

        <nav className={styles.steps} aria-label="Sample steps">
          <a href="#invoices">
            <span>1</span> Invoices
          </a>
          <a href="#menu">
            <span>2</span> Menu
          </a>
          <a href="#sales">
            <span>3</span> Sales
          </a>
          <a href="#morning">
            <span>4</span> Morning
          </a>
        </nav>

        <section className={styles.sections} aria-label="Sample sections">
          <article className={styles.panel} id="invoices">
            <p className={styles.stepLabel}>1 · Invoices · {sample.label}</p>
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
          </article>

          <article className={styles.panel} id="menu">
            <p className={styles.stepLabel}>2 · Menu · {sample.label}</p>
            <h3>Twenty cents more on a pizza.</h3>
            <p>The higher case price adds ${sample.perPizza.toFixed(2)} to each pizza.</p>
            <p className={styles.big}>${sample.perPizza.toFixed(2)}</p>
            <p className={styles.unit}>more per pizza</p>
          </article>

          <article className={styles.panel} id="sales">
            <p className={styles.stepLabel}>3 · Sales · {sample.label}</p>
            <h3>Now give that number a week.</h3>
            <p>
              {sample.sold} pizzas × ${sample.perPizza.toFixed(2)} = ${sample.week} this week.
            </p>
            <p className={styles.big}>${sample.week}</p>
            <p className={styles.unit}>{sample.sold} pizzas sold</p>
          </article>

          <article className={styles.panel} data-section="labor" id="labor">
            <p className={styles.stepLabel}>Labor · {sample.label}</p>
            <h3>The schedule and the clock.</h3>
            <p>
              On your seat, this compares the schedule with who clocked in. This sample
              does not show a labor amount. The one move stays the cheese.
            </p>
          </article>
        </section>

        <footer className={styles.footer}>
          <p>
            {sample.label} only. A sample price change, not money you got back. One restaurant.
            One seat. Free.
          </p>
          <nav aria-label="Footer">
            <a href={ACTION_SHIFT_APP_URL}>app.never86.app</a>
            <Link href="/legacy">Previous homepage</Link>
            <Link href="/legacy/try">Previous try page</Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
