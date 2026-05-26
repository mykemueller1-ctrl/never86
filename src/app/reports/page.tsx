import Link from 'next/link';

export const metadata = {
  title: "Reports | Never 86'd",
  description: 'Operator reports.',
};

const reports = [
  {
    href: '/reports/taco-bamba',
    title: 'Taco Bamba',
    detail: '16 locations · live Toast net sales',
  },
];

export default function ReportsIndex() {
  return (
    <main className="min-h-screen bg-dark-800 px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="text-dark-300 text-sm uppercase tracking-wider mb-1">Never 86&apos;d</p>
        <h1 className="text-4xl font-bold text-gold-500 mb-8">Reports</h1>

        <div className="space-y-3">
          {reports.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="block bg-dark-700 hover:border-gold-500 border border-dark-600 rounded-xl p-5 transition-colors"
            >
              <p className="text-white font-semibold text-lg">{r.title}</p>
              <p className="text-dark-300 text-sm">{r.detail}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
