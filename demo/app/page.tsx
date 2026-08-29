'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FEED = [
  { id: 1, brand: 'Chef Ramos', dish: 'Smoked brisket sliders', price: 24, tag: 'Tailgate Pack' },
  { id: 2, brand: 'Marea', dish: 'Truffle arancini', price: 18, tag: 'Game Day' },
  { id: 3, brand: 'Emmer & Rye', dish: 'Smash burger flight', price: 32, tag: 'Super Bowl' },
];

export default function Page() {
  const [idx, setIdx] = useState(0);
  const [bought, setBought] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const item = FEED[idx];

  function buy() {
    setBought(true);
    setTimeout(() => { setDelivered(true); }, 2600);
  }

  return (
    <div className="relative h-screen w-full max-w-[430px] mx-auto overflow-hidden bg-black">
      {/* in-feed video card */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 to-black" />
      <div className="absolute top-6 left-4 right-4 flex justify-between items-center text-xs text-white/70">
        <span className="font-semibold">For You</span>
        <span>📍 You're at the tailgate · 0.4 mi</span>
      </div>

      <div className="absolute inset-x-4 top-16 bottom-40 rounded-2xl overflow-hidden border border-white/10">
        <div className="h-full w-full flex flex-col justify-end p-5 bg-gradient-to-t from-black/80 to-transparent">
          <div className="text-xs uppercase tracking-widest text-never86-gold">{item.tag}</div>
          <div className="text-2xl font-bold mt-1">{item.brand}</div>
          <div className="text-white/80">{item.dish}</div>
          <div className="text-3xl font-bold mt-3">${item.price}</div>
        </div>
      </div>

      {/* right rail actions */}
      <div className="absolute right-3 bottom-44 flex flex-col gap-5 items-center text-white text-xs">
        <button className="flex flex-col items-center gap-1" onClick={() => setIdx((i) => (i + 1) % FEED.length)}>
          <span className="text-2xl">↑</span>Next
        </button>
        <span className="text-2xl">♥</span><span>Save</span>
        <span className="text-2xl">📣</span><span>Share</span>
      </div>

      {/* Buy Now — never leaves the UI */}
      <div className="absolute bottom-6 left-4 right-4">
        <AnimatePresence>
          {!bought && (
            <motion.button
              key="buy"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onClick={buy}
              className="w-full py-4 rounded-full bg-never86-gold text-black font-bold text-lg shadow-lg shadow-never86-gold/30"
            >
              Buy Now · delivered by Bolt
            </motion.button>
          )}
          {bought && !delivered && (
            <motion.div key="routing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full py-4 rounded-full bg-white/10 text-center text-white/80">
              Routing Bolt driver · 2 min
            </motion.div>
          )}
          {delivered && (
            <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full py-4 rounded-full bg-green-500 text-center text-black font-bold">
              ✓ At your location — enjoy
            </motion.div>
          )}
        </AnimatePresence>
        <div className="text-center text-[10px] text-white/40 mt-2">Never86 + Bolt · first-party · no 3P fees</div>
      </div>
    </div>
  );
}
