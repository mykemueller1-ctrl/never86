import type { Metadata } from 'next';
import { RolePage } from '@/components/RolePage';
import { ROLES, roleSeoDescription, roleSeoTitle } from '@/lib/roles';

const spec = ROLES['coo'];

export const metadata: Metadata = {
  title: roleSeoTitle(spec),
  description: roleSeoDescription(spec),
  openGraph: {
    title: roleSeoTitle(spec),
    description: roleSeoDescription(spec),
    url: `https://www.never86.ai/for/${spec.slug}`,
  },
  alternates: { canonical: `https://www.never86.ai/for/${spec.slug}` },
};

export default function Page() {
  return <RolePage spec={spec} />;
}
