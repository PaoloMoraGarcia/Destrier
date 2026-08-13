import type { Metadata } from 'next';

import { Landing } from '@/components/site/Landing';

export const metadata: Metadata = {
  title: 'Destrier · Be happy about the things you don’t know',
  description:
    'For people with something worth teaching. We help turn what you know into a learning path someone can actually follow.',
  openGraph: {
    title: 'Destrier',
    description: 'Be happy about the things you don’t know.',
    type: 'website',
  },
};

export default function HomePage() {
  return <Landing />;
}
