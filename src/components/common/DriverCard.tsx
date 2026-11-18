'use client';

import { FiPhone } from 'react-icons/fi';

import { LICENCE_SHORT } from '@/data/config';
import { initials } from '@/utils/pricing';
import type { Driver } from '@/types/ride';

export default function DriverCard({ driver }: { driver: Driver }) {
  return (
    <div className="card driver">
      <div className="avatar">{initials(driver.name)}</div>
      <div className="driver-info">
        <b>{driver.name}</b>
        <div className="muted">
          ★ {driver.rating.toFixed(2)} · {driver.trips} courses · permis{' '}
          {LICENCE_SHORT[driver.licence] ?? driver.licence} vérifié
        </div>
      </div>
      <button
        type="button"
        className="btn btn-secondary btn-icon"
        aria-label="Appeler le chauffeur"
        onClick={() => alert('Démo : appel masqué vers le chauffeur.')}
      >
        <FiPhone />
      </button>
    </div>
  );
}
