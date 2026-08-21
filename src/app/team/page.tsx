import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { HumanSiteFooter, HumanSiteHeader } from '@/components/HumanSiteShell';

export const metadata: Metadata = {
  title: "The team — Never 86'd",
  description: "Meet the operators, product people, hospitality technologists, and field storytellers behind Never 86'd.",
  alternates: { canonical: 'https://www.never86.ai/team' },
  openGraph: {
    title: "The team — Never 86'd",
    description: 'Small team. Real restaurant scars. Built in the work, not around it.',
    url: 'https://www.never86.ai/team',
    siteName: "Never 86'd",
    type: 'website',
  },
};

const PEOPLE = [
  {
    name: 'Myke Mueller',
    role: 'Founder · active restaurant operator',
    place: 'Fort Dodge, Iowa',
    image: '/field/myke-kitchen.jpg',
    imageClass: 'object-cover object-bottom',
    bio: "Myke built Never 86'd because the operating tools were not good enough. He still lives the restaurant week at Community Tap & Pizza, and brings firsthand experience from independent restaurants and a 28-location, private-equity-backed group.",
    line: 'The floor on Friday night. The books on Saturday morning.',
  },
  {
    name: 'Victor Hatungimana',
    role: 'Field stories · On the Line 515',
    place: 'Iowa',
    image: '/field/on-the-line-victor.jpg',
    imageClass: 'object-cover object-[50%_34%]',
    bio: 'Victor gets owners, managers, cooks, servers, and builders talking about the parts of hospitality that never make a corporate case study. Those conversations keep the product close to the real work.',
    line: 'Real talk. Real operators. No polished corporate takes.',
  },
  {
    name: 'Kristin Aduna',
    role: 'Product discipline · operator discovery',
    place: 'Restaurant technology',
    image: '/team/kristin.jpg',
    imageClass: 'object-cover',
    bio: 'Kristin brings years of restaurant-technology and customer work to the table. She turns operator pain, messy requests, and customer discovery into product decisions a restaurant team can live with.',
    line: 'The product has to make the next move easier, not add another screen.',
  },
  {
    name: 'Rik Reinhardt',
    role: 'Cofounder · hospitality systems',
    place: 'Denver, Colorado',
    image: '/team/rik.jpg',
    imageClass: 'object-cover',
    bio: 'Rik started as a dishwasher, moved through operations leadership, and spent years designing, installing, and supporting restaurant systems. He knows who gets blamed when technology fails during service.',
    line: 'Operators first. Technology second.',
  },
];

export default function TeamPage() {
  return (
    <main className="human-page min-h-screen">
      <HumanSiteHeader />

      <section className="relative overflow-hidden px-5 pb-20 pt-14 md:px-8 md:pb-28 md:pt-20">
        <div className="human-grid-lines" aria-hidden />
        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="human-kicker">The people behind Never 86&apos;d</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <h1 className="font-serif text-[clamp(4rem,9vw,8rem)] font-medium leading-[0.87] tracking-[-0.055em] text-[#171717]">
              Small team.
              <span className="block italic text-[#005de8]">Real restaurant scars.</span>
            </h1>
            <div className="border-l-4 border-[#005de8] bg-[#fffaf2] p-6 text-lg leading-relaxed text-[#514b43] shadow-[6px_7px_0_rgba(23,48,76,0.12)]">
              Nobody here gets to hide behind “the algorithm.” We show the source, say what is missing, correct the number when it is wrong, and keep the operator&apos;s economics ahead of the platform&apos;s story.
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#d8cec0] px-5 pb-20 pt-14 md:px-8 md:pb-28 md:pt-20">
        <div className="mx-auto max-w-7xl space-y-6">
          {PEOPLE.map((person, index) => (
            <article key={person.name} className="grid overflow-hidden border border-[#cfc3b5] bg-[#fffaf2] shadow-[7px_8px_0_rgba(74,62,49,0.10)] md:grid-cols-[0.75fr_1.25fr]">
              <div className={`relative min-h-[360px] bg-[#d8cec0] ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                <Image src={person.image} alt={person.name} fill sizes="(max-width: 768px) 100vw, 42vw" className={person.imageClass} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-5 pt-16">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white">{person.place}</p>
                </div>
              </div>
              <div className={`flex flex-col justify-center p-7 md:p-12 ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#005de8]">{person.role}</p>
                <h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.03em] text-[#1b1b1b] md:text-5xl">{person.name}</h2>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#585149]">{person.bio}</p>
                <p className="mt-7 border-l-2 border-[#005de8] pl-4 font-serif text-2xl italic leading-snug text-[#25211d]">“{person.line}”</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="human-dark-section px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-center">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#81aefc]">The wider table</p>
            <h2 className="mt-5 font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-white md:text-7xl">The team is bigger than four headshots.</h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#d7dfeb]">
              Vadim and the build team turn operator questions into shipped work. Sally and the Community Tap crew live with the decisions. On the Line guests keep opening the door to how other operators actually think. The product is better because all of them can tell us when we missed.
            </p>
          </div>
          <div className="space-y-3">
            <a href="https://www.tiktok.com/@ontheline515" target="_blank" rel="noreferrer" className="human-button human-button-light w-full">Watch On the Line 515 →</a>
            <Link href="/audit" className="human-button w-full border border-[#7f97b5] text-white hover:bg-white/10">Try the free 3P audit →</Link>
          </div>
        </div>
      </section>

      <HumanSiteFooter />
    </main>
  );
}
