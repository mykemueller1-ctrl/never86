import type { Metadata } from 'next';
import { RolePage } from '@/components/RolePage';
import { ROLES } from '@/lib/roles';

const spec = ROLES['owner'];

export const metadata: Metadata = {
  title: `${spec.badge} · Never 86'd`,
  description: spec.intro,
  openGraph: {
    title: `Never 86'd · ${spec.audience}`,
    description: spec.intro,
    url: `https://never86.ai/for/${spec.slug}`,
  },
  alternates: { canonical: `https://never86.ai/for/${spec.slug}` },
};

export default function Page() {
  return <RolePage spec={spec} />;
}
