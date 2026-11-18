'use client';

import { FUEL_LEVELS, REASONS, SECTORS } from '@/data/config';
import { useRide } from '@/providers/RideProvider';
import { estimate, fuelCheck, money } from '@/utils/pricing';
import type { Province, RideForm } from '@/types/ride';

function SectorOptions({ province, label }: { province: Province; label: string }) {
  return (
    <optgroup label={label}>
      {SECTORS.filter((s) => s.province === province).map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </optgroup>
  );
}

export default function ClientForm() {
  const { state, actions } = useRide();
  const f = state.form;

  const e = estimate(f);
  const filled = Boolean(
    f.pickup.trim() && f.dest.trim() && f.pickupSector && f.destSector && f.car.trim() && f.plate.trim()
  );
  const fc = fuelCheck(f.fuel, e.km);
  const ready = filled && fc.ok;

  const bind = (field: keyof RideForm) => ({
    id: field,
    value: f[field],
    onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      actions.setField(field, ev.target.value),
  });

  return (
    <>
      <div>
        <label htmlFor="pickupSector">Où êtes-vous (avec votre voiture) ?</label>
        <select {...bind('pickupSector')} className="stack">
          <option value="">Secteur…</option>
          <SectorOptions province="ON" label="Ottawa (Ontario)" />
          <SectorOptions province="QC" label="Gatineau (Québec)" />
        </select>
        <input {...bind('pickup')} placeholder="Ex. 55, rue York" aria-label="Adresse de départ" />
      </div>

      <div>
        <label htmlFor="destSector">Où voulez-vous aller ?</label>
        <select {...bind('destSector')} className="stack">
          <option value="">Secteur…</option>
          <SectorOptions province="ON" label="Ottawa (Ontario)" />
          <SectorOptions province="QC" label="Gatineau (Québec)" />
        </select>
        <input {...bind('dest')} placeholder="Ex. 120, rue Principale" aria-label="Adresse d'arrivée" />
      </div>

      <div className="row">
        <div>
          <label htmlFor="car">Votre voiture</label>
          <input {...bind('car')} placeholder="Honda Civic" />
        </div>
        <div>
          <label htmlFor="plate">Plaque</label>
          <input {...bind('plate')} placeholder="ABCD 123" />
        </div>
      </div>

      <div className="row">
        <div>
          <label htmlFor="gearbox">Boîte de vitesses</label>
          <select {...bind('gearbox')}>
            <option value="auto">Automatique</option>
            <option value="manuelle">Manuelle</option>
          </select>
        </div>
        <div>
          <label htmlFor="reason">Raison</label>
          <select {...bind('reason')}>
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="fuel">Niveau de carburant (ou de batterie)</label>
        <select {...bind('fuel')}>
          <option value="">Choisir…</option>
          {FUEL_LEVELS.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
        {!f.fuel && <div className="note hint">Minimum 1/4 de réservoir.</div>}
        {f.fuel && !fc.ok && <div className="err hint">{fc.message}</div>}
        {f.fuel && fc.ok && (
          <div className="note hint">⛽ {filled ? fc.message : 'Minimum 1/4 respecté.'}</div>
        )}
      </div>

      {ready && (
        <div className="card">
          <div className="muted">
            Estimation · {e.km} km · ~{e.minutes} min
            {e.night && ' · tarif de nuit (+20 %)'}
            {e.crossing && ' · traversée de la rivière'}
          </div>
          <div className="price spaced">
            <span>Course</span>
            <span>{money(e.price)}</span>
          </div>
          <div className="price muted">
            <span>{e.taxLabel}</span>
            <span>{money(e.taxAmount)}</span>
          </div>
          <div className="price">
            <b>Total</b>
            <span className="big">{money(e.total)}</span>
          </div>
        </div>
      )}

      <button type="button" className="btn btn-primary btn-block" disabled={!ready} onClick={actions.placeOrder}>
        Commander un chauffeur
      </button>
      <div className="note">Le chauffeur arrive à pied ou en trottinette pliante, qu&apos;il range dans votre coffre.</div>
    </>
  );
}
