import Link from 'next/link';
import type { ReactNode } from 'react';
import './action-shift-door.css';

function ArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6h4" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 16H8" />
      <path d="M14 8H8" />
      <path d="M16 12H8" />
      <path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />
    </svg>
  );
}

function UtensilsIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
      <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" />
      <path d="m2.1 21.8 6.4-6.3" />
      <path d="m19 5-7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function ActionShiftBrand() {
  return (
    <Link className="as-brand" href="/" aria-label="Action Shift by Never 86'd — home">
      <span className="as-brand-mark" aria-hidden="true">86</span>
      <span className="as-brand-name">
        Action Shift
        <span className="as-brand-parent">BY NEVER86’D</span>
      </span>
    </Link>
  );
}

export function ActionShiftHeader() {
  return (
    <header className="as-nav as-wrap">
      <ActionShiftBrand />
      <nav aria-label="Main navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#built-for-you">Built for you</a>
        <Link className="as-signin" href="/login">
          Sign in
          <ArrowUpRight />
        </Link>
      </nav>
    </header>
  );
}

export function ActionShiftFooter() {
  return (
    <footer className="as-footer as-wrap">
      <ActionShiftBrand />
      <p>A second set of eyes for your restaurant.</p>
      <nav aria-label="Footer">
        <Link href="/contact">Get help</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </footer>
  );
}

export function ActionShiftDoor({ extra, children }: { extra?: ReactNode; children?: ReactNode }) {
  return (
    <div className="as-home">
      <a className="skip-link" href="#main">Skip to content</a>
      <ActionShiftHeader />
      <main id="main">
        <section className="as-hero as-wrap" aria-labelledby="hero-title">
          <div className="as-hero-copy">
            <p className="as-kicker">FOR INDEPENDENT RESTAURANT OWNERS · 1–5 LOCATIONS</p>
            <h1 id="hero-title">
              You run the place.
              <br />
              <span>
                Know what to
                <br className="as-desktop-break" /> check next.
              </span>
            </h1>
            <p className="as-lead">
              Food prices. Labor hours. The paperwork after close. Bring what you already have. Action Shift helps you spot changes, check the source, and keep the next action in one place.
            </p>
            <div className="as-hero-actions">
              <Link className="as-button" href="/check/invoices">
                Start with my invoices
                <ArrowRight />
              </Link>
              <Link className="as-text-link" href="/try">
                Explore a sample desk
                <ArrowUpRight />
              </Link>
            </div>
            <p className="as-start-note">
              First owner seat free · One restaurant · one login · No card required · No POS connection to start
            </p>
            {extra}
          </div>
          <div className="as-desk-example" aria-label="Illustrative labor check using fictional sample records">
            <div className="as-example-top">
              <span>YOUR SECOND SET OF EYES</span>
              <span className="as-example-label">FICTIONAL EXAMPLE</span>
            </div>
            <div className="as-example-body">
              <p className="as-example-date">
                <ClockIcon /> Labor check · September 11
              </p>
              <h2>
                The shift ran longer.
                <br />
                Here’s where to look.
              </h2>
              <p>The sample kitchen shift ended two hours later than scheduled.</p>
              <dl className="as-hours">
                <div>
                  <dt>Planned end</dt>
                  <dd>9:00 <span>PM</span></dd>
                </div>
                <div>
                  <dt>Clocked out</dt>
                  <dd>11:00 <span>PM</span></dd>
                </div>
                <div>
                  <dt>Extra time</dt>
                  <dd>+2 <span>hours</span></dd>
                </div>
              </dl>
              <div className="as-source-line">
                <FileIcon />
                <span>Sample schedule + sample time-clock report</span>
              </div>
              <div className="as-next">
                <span className="as-step-number">→</span>
                <div>
                  <p className="as-kicker">A NEXT ACTION TO CONSIDER</p>
                  <p>Ask what kept the kitchen late. Check coverage and breaks before changing a shift.</p>
                </div>
              </div>
              <Link className="as-example-link" href="/try/labor">
                Open the labor example
                <ArrowRight />
              </Link>
            </div>
            <p className="as-example-footer">Illustration, not your restaurant’s results. You decide what to do.</p>
          </div>
        </section>

        <section className="as-checks as-wrap" id="choose-check" aria-labelledby="checks-title">
          <div className="as-section-heading">
            <div>
              <p className="as-kicker">START SMALL</p>
              <h2 id="checks-title">One question. Your own paperwork.</h2>
            </div>
            <p>Choose the check that matters today.</p>
          </div>
          <div className="as-check-grid">
            <article>
              <ReceiptIcon />
              <p className="as-kicker">FOOD &amp; BEVERAGE</p>
              <h3>
                Did my vendor’s
                <br /> price go up?
              </h3>
              <p>Compare matching items, units, and packs across invoices. Only have one invoice? Start there.</p>
              <Link href="/check/invoices">
                Check my invoices
                <ArrowRight />
              </Link>
              <Link className="as-small-link" href="/try">Try the invoice example</Link>
            </article>
            <article>
              <ClockIcon />
              <p className="as-kicker">LABOR</p>
              <h3>
                Did the hours
                <br /> go over the plan?
              </h3>
              <p>Bring a schedule and time-clock report for the same dates. See the difference and what needs a closer look.</p>
              <Link href="/check/labor">
                Check my labor
                <ArrowRight />
              </Link>
              <Link className="as-small-link" href="/try/labor">Try the labor example</Link>
            </article>
            <article>
              <UtensilsIcon />
              <p className="as-kicker">MENU &amp; PORTIONS</p>
              <h3>
                What does this
                <br /> plate really cost?
              </h3>
              <p>Start with one recipe, its portions, and ingredient invoices. Missing prices or quantities stay visible.</p>
              <Link href="/check/menu">
                Check my plate cost
                <ArrowRight />
              </Link>
              <Link className="as-small-link" href="/try/recipes">Try the recipe example</Link>
            </article>
          </div>
        </section>

        <section className="as-process" id="how-it-works" aria-labelledby="process-title">
          <div className="as-wrap as-process-inner">
            <div>
              <p className="as-kicker">FROM PAPERWORK TO FOLLOW-THROUGH</p>
              <h2 id="process-title">
                A clear next step.
                <br />
                Something to come back to.
              </h2>
              <p>Keep the original, the question, and what happened next together in your owner desk.</p>
              <Link className="as-text-link" href="/try">
                Walk through the sample desk
                <ArrowUpRight />
              </Link>
            </div>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <h3>Bring a report.</h3>
                  <p>Add an invoice, close, schedule, or time-clock report. Use the files and photos you already have.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>See what the source supports.</h3>
                  <p>Review the reading and open the original. Unclear dates, units, or totals stay questions until they’re resolved.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>Choose the next action.</h3>
                  <p>Assign a follow-up, set a due date, and record what happened. Your saved work stays connected.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="as-founder as-wrap" id="built-for-you" aria-labelledby="founder-title">
          <div className="as-founder-label">
            <span className="as-founder-monogram" aria-hidden="true">MM</span>
            <p>
              MYKE MUELLER
              <span>
                Restaurant operator &amp; founder
                <br />
                Community Tap &amp; Pizza · Fort Dodge, Iowa
              </span>
            </p>
          </div>
          <div>
            <p className="as-kicker">BUILT FROM THE OPERATOR’S SIDE</p>
            <h2 id="founder-title">
              For the owner who’s also
              <br />
              the backup for everyone.
            </h2>
            <p>
              Action Shift comes from Myke’s work as a third-generation restaurant operator. It’s built for independents juggling the floor, the kitchen, the staff, and the numbers.
            </p>
            <p>Start with one useful check. Keep your existing POS and the way your restaurant works.</p>
            <Link className="as-text-link" href="/contact">
              Want a hand? Talk to Myke
              <ArrowUpRight />
            </Link>
          </div>
        </section>

        <section className="as-faq as-wrap" aria-labelledby="faq-title">
          <div>
            <p className="as-kicker">BEFORE YOU START</p>
            <h2 id="faq-title">
              Fair questions.
              <br /> Straight answers.
            </h2>
          </div>
          <div className="as-faq-list">
            <details>
              <summary>What’s free?</summary>
              <p>
                Your first owner seat is free, with no card required. It is one restaurant and one login. A second location or a second seat stays closed until it is paid. That price is not finalized. We explain it before you commit.
              </p>
            </details>
            <details>
              <summary>Do I have to connect my POS or email?</summary>
              <p>You can start by uploading a report or invoice. No POS or inbox connection is required to run your first check.</p>
            </details>
            <details>
              <summary>Can I use photos and paper schedules?</summary>
              <p>Yes. Add clear photos or upload the files you have. If a reading is incomplete or unclear, review the original before using it.</p>
            </details>
            <details>
              <summary>Will it make changes for me?</summary>
              <p>You choose the action. A flagged price change is something to investigate, not proof of an overcharge. A recorded outcome is not verified savings.</p>
            </details>
            <details>
              <summary>Who can see my restaurant’s records?</summary>
              <p>
                Your restaurant’s records require sign-in. The public examples use fictional data. Read the <Link href="/privacy">privacy notice</Link>.
              </p>
            </details>
          </div>
        </section>

        <section className="as-closing as-wrap">
          <div>
            <p className="as-kicker">YOUR NEXT CHECK STARTS HERE</p>
            <h2>
              Bring one invoice.
              <br />
              Let’s take a look.
            </h2>
          </div>
          <div>
            <Link className="as-button" href="/onboard">
              Claim the free owner seat
              <ArrowRight />
            </Link>
            <p>
              <CheckIcon />
              One restaurant. One login. You stay in control.
            </p>
          </div>
        </section>
        {children}
      </main>
      <ActionShiftFooter />
    </div>
  );
}
