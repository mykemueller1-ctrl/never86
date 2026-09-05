import Link from 'next/link';

const BLUE = '#0066ff';
const BLUE_DEEP = '#003bb5';

const revenueCenters = [
  { name: 'Bar', sales: 13587.96, share: 0.369 },
  { name: 'Dining Room', sales: 18676.93, share: 0.507 },
  { name: 'Music Room', sales: 2548.7, share: 0.069 },
  { name: 'Outside', sales: 2013.75, share: 0.055 },
];

const week = {
  netSales: 36827.34,
  grossSales: 38131.87,
  discounts: 1304.53,
  voids: 226.5,
  voidPct: 0.6,
  cashShortage: 2262.48,
  laborHours: 108.2,
  guests: 1304,
  avgCheck: 28.24,
  tips: 6878.62,
};

const menu = {
  entrees: [
    ['Short Rib', 28], ['Seared Sesame Ahi', 28], ['Tzatziki Salmon', 26], ['Fish & Chips', 24],
    ['Chicken & Broccoli Alfredo', 22], ['Pesto Shrimp Alfredo', 27], ['Green Curry', 24],
    ['Stir Fry', 22], ['Seoul Food', 23], ['Bistro Duck', 30], ['BBQ Salmon', 23],
    ['1/2 Rack Of Ribs', 24], ['Short Rib', 28], ['Surf And Turf', 24], ['NY Strip', 32],
    ['Lemon Chicken', 22], ['Chicken Tikka', 25], ['Chicken Parmesan', 23], ['Shrimp Scampi', 27],
    ['Lobster Alfredo', 35], ['Primavera', 20], ['Mac-N- Cheese', 17], ['Red, White & Blue', 25],
  ],
  burgers: [['Burger', 18], ['Veggie Burger', 16], ['Grilled Chicken Sandwich', 15], ['Crispy BYO Chicken Sandwich', 16]],
  cocktails: [['Manhattan', 19], ['Margarita', 12.5], ['Electric Mayhem Espresso Martini', 17], ['Max\'s Mistake', 13], ['Londonderry Mule', 13], ['HiPPie JuIcE', 12]],
  beer: [['Green State Lager', 9], ['Switchback Ale', 9], ['Lawson\'s Kingdom Trail IPA', 9], ['Narragansett', 5], ['Budweiser', 6], ['Bud Light', 6]],
  wine: [['Sauvignon Blanc', 9], ['Piccini Pinot Grigio', 9], ['Kings Script Pinot Noir', 13], ['Klinker Brick Cab', 11], ['Josh Chardonay', 16]],
  desserts: [['Key Lime Pie', 8], ['Peanut Butter Pie', 8], ['Bread Pudding', 10], ['Lizzy\'s Cannoli', 10], ['Chocolate Cake', 10]],
  kids: [['Kids Mac & Cheese', 14], ['Kids Fish & Chips', 14], ['Kids Pasta', 4.2], ['Kids Quesadilla', 14]],
};

function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function NagPortal() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0066ff] to-[#003bb5] font-bold">N</div>
            <div>
              <p className="text-sm font-semibold">Never 86'd</p>
              <p className="text-xs text-white/50">New American Grill · Max Turner</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-[#0066ff]/15 px-3 py-1 text-[#7db4ff]">Seat 1 · Owner</span>
            <Link href="/nag/prime-cost" className="rounded-lg bg-gradient-to-r from-[#0066ff] to-[#003bb5] px-4 py-2 font-semibold">Prime Cost</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7db4ff]">This week · Aug 24–30</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Find the leak. Close it. Keep the receipt.</h1>
        <p className="mt-4 max-w-2xl text-white/60">One action per screen. Your numbers, your memory, saved forever.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Net sales" value={money(week.netSales)} />
          <Stat label="Avg check" value={money(week.avgCheck)} />
          <Stat label="Voids" value={`${week.voidPct}% · ${money(week.voids)}`} warn />
          <Stat label="Cash shortage" value={money(week.cashShortage)} warn />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold">Revenue by room</h2>
          <div className="mt-5 space-y-4">
            {revenueCenters.map((r) => (
              <div key={r.name}>
                <div className="flex justify-between text-sm">
                  <span>{r.name}</span>
                  <span className="font-semibold">{money(r.sales)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#0066ff] to-[#003bb5]" style={{ width: `${r.share * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold">The leak</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Cash closeout is short {money(week.cashShortage)} against {money(6455.73)} expected.
            Voids are {week.voidPct}% — healthy. Discounts ran {money(week.discounts)} (3.4% of gross), mostly staff and comps.
          </p>
          <Link href="/nag/prime-cost" className="mt-5 inline-flex rounded-lg bg-gradient-to-r from-[#0066ff] to-[#003bb5] px-4 py-2 text-sm font-semibold">Open prime cost →</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-2xl font-semibold">Menu</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(menu).map(([group, items]) => (
            <div key={group} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7db4ff]">{group}</p>
              <ul className="mt-4 space-y-2">
                {items.map(([name, price]) => (
                  <li key={name} className="flex justify-between text-sm">
                    <span className="text-white/80">{name}</span>
                    <span className="font-semibold">{money(price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${warn ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
