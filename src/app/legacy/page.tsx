import type { Metadata } from 'next';
import Link from 'next/link';
import HomePage from '@/components/OwnerHome';
import { publicPageMetadata } from '@/lib/seoAeo';
import styles from '@/components/action-shift-morning.module.css';

export const metadata: Metadata = {
  ...publicPageMetadata({
    path: '/legacy',
    title: "Previous homepage | Never86'd",
    description: 'The previous Never86 homepage. Action Shift is the current page.',
  }),
  robots: { index: false, follow: true },
};

export default function LegacyHomePage() {
  return (
    <>
      <aside className={styles.banner}>
        <Link href="/">Action Shift is the current page.</Link> This is the previous homepage.
      </aside>
      <HomePage />
    </>
  );
}
