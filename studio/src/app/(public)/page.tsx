import type { Metadata } from 'next';

import { Landing } from '@/components/site/Landing';

export const metadata: Metadata = {
  title: 'Bihapia · Disfruta de lo que no sabes',
  description:
    'Un feed sin contadores, sin rachas y sin ranking. Una cosa cada vez, y se acaba cuando quieres.',
  openGraph: {
    title: 'Bihapia',
    description: 'Disfruta de lo que no sabes.',
    type: 'website',
  },
};

export default function HomePage() {
  return <Landing />;
}
