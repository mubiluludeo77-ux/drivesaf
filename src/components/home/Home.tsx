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
      <div className="wrap page-head">
        <h1>Démo : client et chauffeur</h1>
        <p className="muted">
          Les deux écrans côte à côte, sans compte. Choisissez un permis côté chauffeur et appuyez sur <b>Go</b>, puis
          commandez côté client. Sinon, un chauffeur simulé accepte la course.
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
