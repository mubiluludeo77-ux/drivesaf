import type { Metadata } from 'next';

import Home from '@/components/home/Home';

export const metadata: Metadata = {
  title: 'Démo — DriveSAF',
  description: 'Démonstration : écran client et écran chauffeur côte à côte.',
};

export default function Page() {
  return <Home />;
}
