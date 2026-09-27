/** Visible FAQ copy. JSON-LD on /faq must repeat these strings exactly. */

export const PUBLIC_FAQ = [
  {
    question: 'What is Never86?',
    answer:
      "Never86 is a back office for independent restaurants. You sign up, drop in papers you already have — invoices and Z reports — and an owner seat answers from those papers. Every number is tagged Verified, Estimated, or Missing. If a paper is missing, the answer says Missing. It does not invent a dollar.",
  },
  {
    question: 'Who is Never86 for?',
    answer:
      'Independent restaurant owners who do the books themselves, usually one to five locations and no office staff. Myke Mueller built it while running Community Tap & Pizza, a pizza bar in Fort Dodge, Iowa.',
  },
  {
    question: 'How is Never86 different from a POS?',
    answer:
      'A POS rings up the sale. Never86 reads the papers after the sale: invoices, Z reports, and delivery statements you already have. No POS connection is required to start. It does not replace your register.',
  },
  {
    question: 'Does Never86 work with DoorDash and Uber Eats orders?',
    answer:
      'You can start with a DoorDash statement you already have. The public page at /audit does the math from totals you type. It does not log into a merchant portal. Uber Eats and Grubhub are early access. A delivery fee is a pain the seat can show. It is not a promise that money comes back.',
  },
  {
    question: 'What does Never86 cost?',
    answer:
      'The first owner seat is free. No card to start. Extra seats and extra locations are planned as paid options. That price is not finalized. We explain it before you commit.',
  },
] as const;
