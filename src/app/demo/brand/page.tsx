import type { Metadata } from 'next';
import Link from 'next/link';
import s from './page.module.css';

export const metadata: Metadata = {
  title: 'The Never86’d color direction',
  description: 'The selected colors, typography and visual roles for the Never86’d operator demo.',
  robots: { index: false, follow: true },
};

const colors = [
  { name: 'Charcoal', hex: '#25262A', role: 'Structure, headlines and the numbers.', dark: true },
  { name: 'Warm ivory', hex: '#F8F6F2', role: 'Room to read, think and get the job done.', dark: false },
  { name: 'Ember orange', hex: '#B84322', role: 'The main action. A little goes a long way.', dark: true },
];

export default function DemoBrandPage() {
  return <main className={s.page}>
    <header className={s.header}><Link href="/demo/operator" className={s.brand}><span>86</span>Never86’d</Link><span>THE COLOR DIRECTION</span></header>
    <section className={s.intro}><p className={s.eyebrow}>CHOSEN FOR THE OPERATOR</p><h1>Built for a<br /><em>busy shift.</em></h1><p>A warm place to work. Clear numbers. One next move that stands out.</p></section>
    <section className={s.palette} aria-label="The three main brand colors">{colors.map(color => <article key={color.name}><div className={s.swatch} style={{ backgroundColor: color.hex, color: color.dark ? '#ffffff' : '#25262a' }}><span>{color.name}</span><strong>{color.hex}</strong></div><p>{color.role}</p></article>)}</section>
    <section className={s.examples} aria-label="How the colors work together">
      <article className={s.marketing}><span className={s.eyebrow}>FOR THE FIRST LOOK</span><h2>The price moved.<br /><em>Let’s find out why.</em></h2><p>Use a clear cost question, a real source and an obvious next action. Keep the rest of the page quiet.</p><Link href="/demo/operator" className={s.action}>Try the operator desk <span aria-hidden="true">↗</span></Link></article>
      <article className={s.receipt}><span className={s.eyebrow}>INSIDE THE DESK · FICTIONAL SAMPLE</span><div className={s.sampleTitle}><h2>Whole milk mozzarella</h2><span className={s.review}>Price up 8.3%</span></div><div className={s.price}><strong>$2.60</strong><span>per lb · previously $2.40</span></div><p>Ask what changed before the next order.</p><div className={s.saved}><span aria-hidden="true">✓</span><div><strong>Draft kept in this tab</strong><span>Alex · next shift at 4 pm · nothing sent</span></div></div></article>
    </section>
    <section className={s.rules} aria-label="The role of each interface color"><div><p className={s.eyebrow}>EVERY COLOR HAS A JOB</p><h2>Keep the meaning clear.</h2><p>Orange points to an action. Status colors come with words, symbols and numbers, so the message still makes sense without color.</p></div><ul><li><span className={s.blueDot} /><div><strong>Slate blue · #395674</strong><p>Saved work and useful information.</p></div></li><li><span className={s.amberDot} /><div><strong>Amber · #805400</strong><p>A price change or detail that needs a look.</p></div></li><li><span className={s.redDot} /><div><strong>Brick red · #A12F33</strong><p>An input error that needs correcting.</p></div></li></ul></section>
    <section className={s.type}><div><p className={s.eyebrow}>TYPE THAT GETS OUT OF THE WAY</p><h2>Inter. Clear words.<br />Steady numbers.</h2><p>One sans serif family. Strong headings, readable labels and prices whose digits line up.</p></div><div className={s.typeSample}><strong>Aa</strong><span>$156.00<br />$162.00</span></div></section>
    <footer className={s.footer}><p>The chosen pairings were checked for contrast. Main text on ivory: 14.00:1. White text on ember: 5.43:1. Input outlines on white: 3.82:1.</p><p>Design judgment informed by <a href="https://www.adobe.com/express/learn/blog/design-trends-2026">Adobe’s 2026 design outlook</a>, <a href="https://www.nngroup.com/articles/visual-hierarchy-ux-definition/">Nielsen Norman Group’s visual hierarchy guidance</a> and <a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html">W3C contrast guidance</a>. These checks do not establish a full accessibility audit or a measured conversion lift.</p><Link href="/demo/operator">Open the working sample →</Link></footer>
  </main>;
}
