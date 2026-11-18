'use client';

import { useState } from 'react';

import ClientScreen from '@/components/client/ClientScreen';
import DriverScreen from '@/components/driver/DriverScreen';
import { useRide } from '@/providers/RideProvider';

type Tab = 'client' | 'driver';

export default function Home() {
  const { state } = useRide();
  const [tab, setTab] = useState<Tab>('client');
  const waiting = state.driverOnline && state.status === 'searching';

  return (
    <main>
      <div className="wrap intro">
        <h1>Rentrez chez vous, dans votre voiture</h1>
        <p>
          Un chauffeur vient à vous et vous ramène <b>dans votre propre voiture</b> quand vous ne pouvez pas conduire.
          Prototype de démonstration.
        </p>
      </div>

      {/* Sur tablette et mobile, un seul écran à la fois */}
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'client'}
          className={`btn ${tab === 'client' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('client')}
        >
          Côté client
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'driver'}
          className={`btn ${tab === 'driver' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('driver')}
        >
          Côté chauffeur
          {waiting && <span className="badge">1</span>}
        </button>
      </div>

      <div className="screens">
        <ClientScreen visible={tab === 'client'} />
        <DriverScreen visible={tab === 'driver'} />
      </div>
    </main>
  );
}
