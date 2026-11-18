import type { Metadata } from 'next';

import CommanderView from '@/components/client/CommanderView';

export const metadata: Metadata = {
  title: 'Commander un chauffeur — DriveSAF',
  description: 'Commandez un chauffeur qui vous ramène dans votre voiture, à Ottawa–Gatineau.',
};

export default function Page() {
  return <CommanderView />;
}
