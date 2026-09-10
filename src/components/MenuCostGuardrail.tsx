'use client';

import { useState } from 'react';
import { menuFoodCost } from '@/lib/menuFoodCost';
import s from './OperatorDemo.module.css';

const amount = (value: string) => value.trim() ? Number(value) : NaN;
const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function MenuCostGuardrail({ currentCheeseCost, onReview }: { currentCheeseCost: number | null; onReview: () => void }) {
  const [menuPrice, setMenuPrice] = useState('16');
  const [target, setTarget] = useState('30');
  const [portion, setPortion] = useState('8');
  const [other, setOther] = useState('3.60');
  const now = menuFoodCost(amount(menuPrice), amount(other), amount(portion), currentCheeseCost, amount(target));
  const before = menuFoodCost(amount(menuPrice), amount(other), amount(portion), 2.4, amount(target));
  const difference = now && before ? now.plateCost - before.plateCost : null;
  return <section className={s.foodGuard} aria-label="Menu food cost target">
    <div className={s.resultTop}><span>WHAT THIS DOES TO YOUR MENU</span><strong>Your recipe. Your target.</strong></div>
    <h2>Cheese pizza</h2>
    {now ? <><div className={s.foodNumbers}><div><strong style={{ color: now.overTarget ? '#805400' : '#395674' }}>{now.foodCostPercent.toFixed(1)}%</strong><span>food cost now</span></div><div><strong>{target}%</strong><span>your food cost target</span></div></div>
      <p className={s.foodImpact}>{difference !== null && Math.abs(difference) > 1e-9 ? <><b>{money(Math.abs(difference))} {difference > 0 ? 'more' : 'less'} per pizza.</b> </> : <>The ingredient cost is unchanged. </>}{now.overTarget ? 'This recipe is above your target. Check the increase before changing your menu price.' : 'This recipe is within your target at these prices.'}</p>
      <p className={s.foodBasis}>Selling for {money(amount(menuPrice))}. Ingredients now cost {money(now.plateCost)}. The recipe uses {portion} oz of cheese.</p>
    </> : <p className={s.inputError}>We need the recipe amounts, menu price, target and usable cheese cost before checking food cost.</p>}
    <details className={s.recipeDetails}><summary>Check the recipe and target</summary><div className={s.fieldPair}>
      <label>Menu price before tax · $<input type="number" min="0.01" step="0.01" value={menuPrice} onChange={e=>setMenuPrice(e.target.value)} /></label>
      <label>Your food cost target · %<input type="number" min="0.01" max="100" step="0.1" value={target} onChange={e=>setTarget(e.target.value)} /></label>
      <label>Cheese per pizza · oz<input type="number" min="0.01" step="0.1" value={portion} onChange={e=>setPortion(e.target.value)} /></label>
      <label>Other ingredients per pizza · $<input type="number" min="0" step="0.01" value={other} onChange={e=>setOther(e.target.value)} /></label>
    </div><p>Fictional recipe for this preview. The target is editable, not a recommended industry rate. This uses Hilltop cheese, the recorded portion and the other ingredient costs entered here. It excludes labor, rent, packaging, delivery charges and unrecorded waste. The earlier cheese price was $2.40 per usable lb. No menu prices are changed.</p></details>
    <button type="button" className={s.primary} disabled={!now} onClick={onReview}>Review the prepared follow up <span aria-hidden="true">↗</span></button>
    <p className={s.foodBasis}>The question, person and due time are ready. You review it.</p>
  </section>;
}
