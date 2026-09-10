'use client';

import { useRef, useState } from 'react';
import {
  compareVendorOrders, vendorPriceDrift, HILLTOP_BEFORE, HILLTOP_NOW,
  LAKEFRONT_BEFORE, LAKEFRONT_NOW, HILLTOP_TERMS, LAKEFRONT_TERMS,
  type OrderTerms, type VendorPrice,
} from '@/lib/operatorVendors';
import s from './OperatorDemo.module.css';
import { MenuCostGuardrail } from './MenuCostGuardrail';

const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const number = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });
const percent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
const amount = (value: string) => value.trim() ? Number(value) : NaN;
const optionalAmount = (value: string) => value.trim() ? Number(value) : null;

type VendorInputs = {
  price: string; pounds: string; fee: string; minimum: string; other: string; yield: string;
  delivery: OrderTerms['arrivesInTime']; stock: OrderTerms['available'];
};
const firstDefaults: VendorInputs = { price: '78', pounds: '30', fee: '0', minimum: '150', other: '0', yield: '100', delivery: 'yes', stock: 'yes' };
const secondDefaults: VendorInputs = { ...firstDefaults, price: '75', fee: '12', minimum: '100' };

export type VendorHandoff = { title: string; evidence: string; proof: string; question: string };

export function OperatorVendorCheck({ onChecked, onDraft }: { onChecked: () => void; onDraft: (handoff: VendorHandoff) => void }) {
  const [first, setFirst] = useState(firstDefaults);
  const [second, setSecond] = useState(secondDefaults);
  const [needed, setNeeded] = useState('60');
  const [match, setMatch] = useState('same');
  const [checked, setChecked] = useState(true);
  const [scenario, setScenario] = useState('delivery');
  const resultRef = useRef<HTMLDivElement>(null);
  const terms = (input: VendorInputs, base: OrderTerms): OrderTerms => ({
    ...base, deliveryFee: optionalAmount(input.fee), minimumOrder: optionalAmount(input.minimum),
    otherItemsInOrder: optionalAmount(input.other), usableYieldPercent: optionalAmount(input.yield),
    arrivesInTime: input.delivery, available: input.stock,
  });
  const firstPrice = { ...HILLTOP_NOW, casePrice: amount(first.price), poundsPerCase: amount(first.pounds) };
  const secondPrice: VendorPrice = {
    ...LAKEFRONT_NOW, casePrice: amount(second.price), poundsPerCase: amount(second.pounds),
    productId: match === 'same' ? LAKEFRONT_NOW.productId : match === 'substitute' ? 'sample-part-skim-shred' : null,
    product: match === 'substitute' ? 'Part skim mozzarella · shredded' : LAKEFRONT_NOW.product,
  };
  const firstTerms = terms(first, HILLTOP_TERMS);
  const secondTerms = terms(second, LAKEFRONT_TERMS);
  const comparison = compareVendorOrders(firstPrice, firstTerms, secondPrice, secondTerms, amount(needed));
  const firstDrift = vendorPriceDrift(HILLTOP_BEFORE, firstPrice);
  const secondDrift = vendorPriceDrift(LAKEFRONT_BEFORE, secondPrice);
  const rows = [
    { input: first, set: setFirst, before: HILLTOP_BEFORE, now: firstPrice, drift: firstDrift, order: comparison?.firstOrder, letter: 'H' },
    { input: second, set: setSecond, before: LAKEFRONT_BEFORE, now: secondPrice, drift: secondDrift, order: comparison?.secondOrder, letter: 'L' },
  ];
  const blockers = comparison?.blockers ?? [];
  const goodsDifference = comparison?.sameProduct && comparison.firstOrder.itemSubtotal !== null && comparison.secondOrder.itemSubtotal !== null
    ? comparison.secondOrder.itemSubtotal - comparison.firstOrder.itemSubtotal : null;
  const difference = comparison?.orderDifference ?? null;
  const feeReversesPrice = goodsDifference !== null && goodsDifference < -0.005 && difference !== null && difference > 0.005;

  function runCheck() {
    if (!comparison) return;
    setChecked(true);
    onChecked();
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      resultRef.current?.focus({ preventScroll: true });
    }, 30);
  }

  function tryScenario(value: string) {
    setScenario(value); setFirst(firstDefaults); setNeeded('60'); setMatch('same');
    const input = { ...secondDefaults };
    if (value === 'free') input.fee = '0';
    if (value === 'pack') { input.price = '65'; input.pounds = '25'; }
    if (value === 'substitute') { setMatch('substitute'); input.price = '69'; }
    if (value === 'late') input.delivery = 'no';
    if (value === 'missing') input.fee = '';
    if (value === 'minimum') input.minimum = '300';
    setSecond(input);
  }

  function draftQuestion(vendorIndex: number) {
    if (!comparison) return;
    const row = rows[vendorIndex];
    const drift = row.drift;
    const lines = [`Hey, can you check our mozzarella price before the next order? Your item number is ${row.now.vendorSku}.`];
    if (drift) {
      lines.push(`${row.before.sourceId} shows ${money(row.before.casePrice)} for ${row.before.poundsPerCase} lb. ${row.now.sourceId}${row.now.kind === 'quote' ? ' (quote)' : ''} shows ${money(row.now.casePrice)} for ${row.now.poundsPerCase} lb. That is ${money(drift.beforePerPound)}/lb then and ${money(drift.nowPerPound)}/lb now.`);
      if (Math.abs(drift.perPoundChange) > 1e-9) lines.push('What changed? Did a special end, did the case size change, or did our agreed price change? When did it start?');
      else lines.push('The price per pound is the same. Is it still the same cheese, case size and delivery deal?');
    } else lines.push('Can you send a photo of the box label and the case weight? We need to check that it is the cheese we use.');
    lines.push(`We need ${needed} lb we can use before Friday prep. Is it in stock? When can you get it here? What is the minimum order, and are there any delivery or other charges?`);
    if (vendorIndex === 1) lines.push(`We have ${secondTerms.deliveryFee === null ? 'no confirmed delivery charge' : money(secondTerms.deliveryFee) + ' for delivery'} on this quote. Does that apply to this order, and is the price still good?`);
    lines.push('Send the explanation and final price in writing. If the bill or quote is wrong, please send the corrected copy.');
    onDraft({
      title: `Confirm ${vendorIndex === 0 ? 'Hilltop' : 'Lakefront'} pricing and delivery`,
      question: lines.join('\n\n'),
      evidence: `Fictional, editable demo records. ${row.before.sourceId}: ${money(row.before.casePrice)} / ${row.before.poundsPerCase} lb. ${row.now.sourceId}: ${money(row.now.casePrice)} / ${row.now.poundsPerCase} lb (${row.now.kind}). Cheese checked: ${match === 'same' ? 'same cheese in sample' : match === 'substitute' ? 'different cheese' : 'label still needed'}. Need: ${needed} usable lb. Entered delivery: ${row.input.fee.trim() ? money(Number(row.input.fee)) : 'Missing'}. Minimum order: ${row.input.minimum.trim() ? money(Number(row.input.minimum)) : 'Missing'}. No vendor reply has been received.`,
      proof: 'Vendor reply, box label and final invoice or quote',
    });
  }

  let headline: React.ReactNode = 'Check the missing details first.';
  let explanation = 'Keep the facts we have. Ask for the piece that changes the order.';
  let draftVendor = firstDrift && firstDrift.perPoundChange > 0 ? 0 : secondDrift && secondDrift.perPoundChange > 0 ? 1 : 0;
  let nextMove = (firstDrift && firstDrift.perPoundChange > 0) || (secondDrift && secondDrift.perPoundChange > 0)
    ? `Ask ${draftVendor === 0 ? 'Hilltop' : 'Lakefront'} what changed before the next order.`
    : 'Confirm the product, quote and delivery terms before ordering.';
  if (comparison) {
    if (blockers.includes('product')) {
      draftVendor = 1;
      headline = match === 'substitute' ? <>Different cheese.<em>Check the recipe first.</em></> : <>Same cheese?<em>Get the label first.</em></>;
      explanation = 'Do both boxes contain the cheese you use? Check the brand, whole milk or part skim, and block or shredded. If it melts differently or changes prep, the lower price may not help.';
      nextMove = 'Get Lakefront’s product label and confirm it works in your recipe.';
    } else if (blockers.includes('yield')) {
      draftVendor = firstTerms.usableYieldPercent === null ? 0 : 1;
      headline = <>How much can<em>the kitchen actually use?</em></>;
      explanation = 'How much is left after trimming or prep? We need that number to know how many cases to order.';
      nextMove = 'Check how much is left after prep.';
    } else if (blockers.includes('fees')) {
      draftVendor = firstTerms.deliveryFee === null ? 0 : 1;
      headline = <>The delivery charge<em>can change the call.</em></>;
      explanation = 'We have the cheese prices. We still need the delivery charge. An empty box does not mean delivery is free.';
      nextMove = 'Ask for the delivery charge before comparing the order totals.';
    } else if (blockers.includes('minimum-unmet') || blockers.includes('minimum-unknown')) {
      draftVendor = comparison.firstOrder.minimumGap === null || comparison.firstOrder.minimumGap > 0 ? 0 : 1;
      headline = <>Check the minimum<em>before switching orders.</em></>;
      explanation = 'This cheese order may not meet the vendor’s minimum. Count the other items already planned for that order. Buying extra food just to hit the minimum ties up cash and cooler space.';
      nextMove = 'Confirm the minimum and the rest of your planned order.';
    } else if (blockers.includes('delivery') || blockers.includes('stock')) {
      draftVendor = firstTerms.arrivesInTime !== 'yes' || firstTerms.available !== 'yes' ? 0 : 1;
      headline = <>A good price only helps<em>if it gets here in time.</em></>;
      explanation = 'Stock or delivery before Friday prep is not confirmed for both vendors. The prices remain useful, but they cannot settle this order yet.';
      nextMove = 'Get stock and delivery confirmed before changing the order.';
    } else if (feeReversesPrice) {
      headline = <>{money(Math.abs(goodsDifference!))} less on cheese.<em>{money(difference!)} more to get it here.</em></>;
      explanation = `Lakefront charges less for the cheese. Add ${money(secondTerms.deliveryFee!)} to deliver the ${needed} lb order, and it costs more. Also ask why each vendor’s price went up this week.`;
    } else if (difference === 0) {
      headline = <>Same order cost.<em>Check what works for the kitchen.</em></>;
      explanation = 'The full cases and delivery add up to the same amount. Is it the same cheese, and can they get it here when you need it?';
    } else if (difference !== null) {
      headline = <>Lakefront is {money(Math.abs(difference))} {difference > 0 ? 'higher' : 'lower'}<em>for this order.</em></>;
      explanation = `That covers full cases and delivery for the ${needed} lb you need. ${comparison.secondOrder.extraUsablePounds! > 0 ? `Lakefront leaves ${number(comparison.secondOrder.extraUsablePounds!)} extra lb after prep. Can you use it, and do you have room for it?` : 'Confirm the quote and delivery terms before making the call.'}`;
    }
  }

  return <section className={s.vendorSection} aria-label="Vendor prices and order comparison">
    <div className={s.vendorLead}><span className={s.coachAvatar}>86</span><div><strong>Same cheese. Two vendors. Prices tracked together.</strong><p>See who charges what and what went up. The matching item numbers stay with the invoice details.</p></div></div>
    <div className={s.needRow}><div><span className={s.eyebrow}>ON YOUR PREP LIST</span><h2>Whole milk mozzarella</h2><p>Millhouse · block</p></div><label>Needed by Friday<input type="number" min="1" step="1" value={needed} onChange={event => { setNeeded(event.target.value); setScenario('custom'); }} aria-label="Usable pounds needed by Friday" /><span>lb for prep</span></label></div>
    {!checked && <div className={s.checkRow}><button type="button" className={s.primary} onClick={runCheck} disabled={!comparison}>Check prices & delivery<span aria-hidden="true">↗</span></button><span>Sample records ready. No signup.</span></div>}
    <div className={s.vendorGrid}>
      {rows.map((row, index) => <article key={row.now.vendorId} className={s.vendorCard}>
        <div className={s.vendorName}><span className={index === 1 ? s.vendorAvatarAlt : s.vendorAvatar}>{row.letter}</span><div><h3>{row.now.vendor}</h3><p>{index === 0 ? 'Your vendor · this week’s invoice' : 'Other vendor · this week’s quote'}</p></div></div>
        <div className={s.unitPrice}><strong>{row.order ? money(row.order.perPound) : 'Missing'}</strong><span>/ lb purchased</span></div>
        <div className={s.priceHistory}><span>Sep 1 · case <strong>{money(row.before.casePrice)}</strong></span><span className={s.historyTrack} aria-hidden="true">→</span><span>Sep 8 · case <strong>{Number.isFinite(row.now.casePrice) && row.now.casePrice > 0 ? money(row.now.casePrice) : 'Missing'}</strong></span><b className={!row.drift ? s.driftUnknown : row.drift.perPoundChange > 0 ? s.driftUp : row.drift.perPoundChange < 0 ? s.driftDown : undefined}>{row.drift ? `${percent(row.drift.percentChange)} per lb` : 'Check product'}</b></div>
        <div className={s.vendorFields}><label>Case price · $<input type="number" min="0.01" step="0.01" aria-label={`${row.now.vendor} case price`} value={row.input.price} onChange={event => { row.set({ ...row.input, price: event.target.value }); setScenario('custom'); }} /></label><label>Weight per case · lb<input type="number" min="0.01" step="0.01" aria-label={`${row.now.vendor} case weight`} value={row.input.pounds} onChange={event => { row.set({ ...row.input, pounds: event.target.value }); setScenario('custom'); }} /></label></div>
        <details className={s.invoiceDetails}><summary>Invoice details</summary><p>Item {row.now.vendorSku} · {row.now.sourceId}{index === 1 && ' · quote needs confirmation'}</p></details>
        {row.drift?.packChanged && <p className={s.packAlert}>Smaller or bigger box? It was {row.before.poundsPerCase} lb. Now it is {row.now.poundsPerCase} lb. Check the price per pound.</p>}
      </article>)}
    </div>
    <MenuCostGuardrail currentCheeseCost={comparison?.firstOrder.perUsablePound ?? null} onReview={() => draftQuestion(0)} />
    <details className={s.orderDetails}><summary>Check product, delivery & order details<span>These can change the answer</span></summary>
      <div className={s.detailBody}><label className={s.productSelect}>Does Lakefront have the same product?<select value={match} onChange={event => { setMatch(event.target.value); setScenario('custom'); }}><option value="same">Same maker, whole milk, block · sample labels checked</option><option value="unconfirmed">Not checked yet · need a label</option><option value="substitute">Different product · part skim, shredded</option></select></label><p className={s.detailNote}>Vendors can give the same cheese different item numbers. Check the box label, what is inside and the case weight before you switch.</p>
      <div className={s.vendorGrid}>{rows.map(row => <fieldset key={row.now.vendorId} className={s.termsFields}><legend>{row.now.vendor}</legend><div className={s.fieldPair}>
        {([['fee', 'Delivery for this order · $'], ['minimum', 'Order minimum · $'], ['other', 'Other planned items · $'], ['yield', 'Left after prep · %']] as const).map(([key, label]) => <label key={key}>{label}<input type="number" min={key === 'yield' ? '0.01' : '0'} max={key === 'yield' ? '100' : undefined} step="0.01" placeholder="Missing" aria-label={`${row.now.vendor} ${label}`} value={row.input[key]} onChange={event => { row.set({ ...row.input, [key]: event.target.value }); setScenario('custom'); }} /></label>)}
        <label>Before Friday prep?<select aria-label={`${row.now.vendor} delivery timing`} value={row.input.delivery} onChange={event => { row.set({ ...row.input, delivery: event.target.value as OrderTerms['arrivesInTime'] }); setScenario('custom'); }}><option value="yes">Yes · confirmed in sample</option><option value="unknown">Need to confirm</option><option value="no">No · arrives too late</option></select></label>
        <label>Can they fill it?<select aria-label={`${row.now.vendor} stock availability`} value={row.input.stock} onChange={event => { row.set({ ...row.input, stock: event.target.value as OrderTerms['available'] }); setScenario('custom'); }}><option value="yes">Yes · sample stock confirmed</option><option value="unknown">Need to confirm</option><option value="no">Out of stock</option></select></label>
      </div></fieldset>)}</div><p className={s.detailNote}>This sample uses the full cheese block. If some is lost in prep, enter the percent left. Delivery is charged once for this order. Other planned items count toward the minimum. This check leaves out tax, rebates and other charges.</p></div>
    </details>
    {!comparison && <p role="status" className={s.inputError}>Enter a positive case price, case weight and amount needed. Fees and order amounts cannot be negative. The percent left after prep must be above 0 and no more than 100%.</p>}
    {checked && <div ref={resultRef} tabIndex={-1} className={s.vendorResult} aria-label="Calculated vendor result">
      <div className={s.resultTop}><span>THE ORDER CHECK</span><strong>Updates as prices change</strong></div>
      {!comparison ? <p className={s.resultExplanation}>Correct the inputs above to bring the comparison back.</p> : <>
        <h2 className={s.vendorHeadline}>{headline}</h2><p className={s.resultExplanation}>{explanation}</p>
        <div className={s.orderTotals}>{rows.map(row => <div key={row.now.vendorId}><span>{row.now.vendor}</span><strong>{row.order?.orderCost == null ? 'Missing' : money(row.order.orderCost)}</strong><p>{row.order?.cases == null ? 'Check how much is left after prep' : `${row.order.cases} whole cases · ${number(row.order.boughtPounds!)} lb purchased`}</p><small>{row.order?.itemSubtotal == null ? 'Item amount missing' : `${money(row.order.itemSubtotal)} cheese`} + {row.input.fee.trim() ? `${money(Number(row.input.fee))} delivery` : 'delivery missing'}</small>{row.order?.extraUsablePounds != null && row.order.extraUsablePounds > 0 && <b>{number(row.order.extraUsablePounds)} extra lb after prep to store</b>}{row.order?.minimumGap != null && row.order.minimumGap > 0 && <b>{money(row.order.minimumGap)} short of the minimum</b>}{row.order?.minimumGap === null && <b>Minimum order needs confirmation</b>}{row.input.delivery !== 'yes' && <b>{row.input.delivery === 'no' ? 'Arrives after Friday prep' : 'Delivery needs confirmation'}</b>}{row.input.stock !== 'yes' && <b>{row.input.stock === 'no' ? 'Out of stock' : 'Stock needs confirmation'}</b>}</div>)}</div>
        <p className={s.totalNote}>Cheese + entered delivery only. {comparison.comparable ? 'Confirm the quote before ordering.' : 'The details above must be resolved before choosing on price.'}</p>
        <div className={s.nextAction}><div><span>BEFORE THE NEXT ORDER</span><p>{nextMove}</p></div><button type="button" className={s.primary} onClick={() => draftQuestion(draftVendor)}>Review the prepared question<span aria-hidden="true">↗</span></button></div>
        <button type="button" className={s.textButton} onClick={() => draftQuestion(draftVendor === 0 ? 1 : 0)}>Or check with {draftVendor === 0 ? 'Lakefront' : 'Hilltop'} <span aria-hidden="true">→</span></button>
        <div className={s.whyHeading}><h3>Why it deserves a look</h3><span>Facts first. Then the question.</span></div>
        <div className={s.whyGrid}>
          <article><span>01 / WHAT WENT UP?</span><h4>Watch both vendors.</h4><p>Hilltop: {firstDrift ? percent(firstDrift.percentChange) : 'product check needed'}. Lakefront: {secondDrift ? percent(secondDrift.percentChange) : 'product check needed'}. A lower quote can still be up from last week.</p><small>Did a special end? Did your agreed price change? The invoices show the change. The vendor still needs to explain why.</small></article>
          <article><span>02 / SAME CHEESE? SAME BOX?</span><h4>{comparison.sameProduct ? 'Compare what you use.' : 'Check the label first.'}</h4><p>{comparison.sameProduct ? `Same cheese. Hilltop has ${first.pounds} lb per case. Lakefront has ${second.pounds} lb. You buy full cases. Check how much is left after prep.` : 'Part skim, whole milk, block and shredded are not automatic swaps.'}</p><small>Will it work in your recipe? An item number alone cannot tell you that.</small></article>
          <article><span>03 / CAN IT GET HERE?</span><h4>Make Friday prep work.</h4><p>Delivery fees, stock, minimums and extra cases all matter. The amount needed comes from your prep plan.</p><small>Confirm timing and use the order already planned. More food in the cooler is not money saved.</small></article>
        </div>
        <details className={s.math}><summary>Show the numbers and source records</summary><div>{rows.map(row => <p key={row.now.vendorId}><strong>{row.now.vendor}</strong><br />{row.before.sourceId} · Sep 1 invoice: {money(row.before.casePrice)} ÷ {row.before.poundsPerCase} lb = {money(row.before.casePrice / row.before.poundsPerCase)}/lb.<br />{row.now.sourceId} · Sep 8 {row.now.kind}: {money(row.now.casePrice)} ÷ {row.now.poundsPerCase} lb = {money(row.now.casePrice / row.now.poundsPerCase)}/lb.<br />{row.drift ? `Price change: (this week’s price per pound ÷ last week’s price per pound − 1) × 100 = ${percent(row.drift.percentChange)}.` : 'Check the box label before comparing the price change.'}<br />{row.order?.cases != null ? `Whole cases: round up ${needed} usable lb ÷ (${row.now.poundsPerCase} lb × ${row.input.yield}% usable). ${row.order.cases} × ${money(row.now.casePrice)} = ${money(row.order.itemSubtotal!)} in cheese.` : 'We need the percent left after prep to calculate the cases.'}</p>)}<p>All records are fictional and editable. Prices use unrounded values in the calculation. Case orders round up. This is a comparison of entered facts, not a confirmed error, credit or saving. No live vendor data or messages are used.</p></div></details>

      </>}
      <div className={s.scenarioBox}><h3>What would change the call?</h3><p>Still need 60 lb? Try a smaller box, a late truck or a delivery charge. See what changes.</p><div className={s.scenarioButtons}>{[
        ['delivery', '$12 delivery'], ['free', 'Free delivery'], ['pack', 'Smaller case'],
        ['substitute', 'Different cheese'], ['late', 'Late delivery'], ['minimum', '$300 minimum'], ['missing', 'Fee missing'],
      ].map(([value, label]) => <button type="button" key={value} aria-pressed={scenario === value} onClick={() => tryScenario(value)}>{label}</button>)}</div></div>
    </div>}
  </section>;
}
