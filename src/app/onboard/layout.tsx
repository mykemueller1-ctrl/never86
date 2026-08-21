import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Onboard your restaurant | Never 86'd",
  description: "Tell Never86'd which restaurant system and operator problem should be addressed first.",
  alternates: { canonical: 'https://www.never86.ai/onboard' },
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
