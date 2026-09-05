import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New American Grill · Never 86\'d',
  description: 'Max Turner\'s operator desk — prime cost, voids, labor, cash closeout.',
};

export default function NagLayout({ children }: { children: React.ReactNode }) {
  return children;
}
