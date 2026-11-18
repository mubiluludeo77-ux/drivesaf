import type { Metadata } from 'next';

import DriverSpace from '@/components/driver/DriverSpace';

export const metadata: Metadata = {
  title: 'Espace chauffeur — DriveSAF',
  description: 'Recevez des courses et ramenez les clients dans leur propre voiture.',
};

export default function Page() {
  return <DriverSpace />;
}
