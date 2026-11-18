'use client';

import MapView from '@/components/common/MapView';
import ProgressEta from '@/components/common/ProgressEta';
import { DRIVER_SHARE, LICENCES, findSector, licenceOk } from '@/data/config';
import { useRide } from '@/providers/RideProvider';
import { fuelLabel, money } from '@/utils/pricing';
import type { LicenceCode } from '@/types/ride';

export default function DriverScreen({ visible }: { visible: boolean }) {
  const { state, actions } = useRide();
  const { status, order: o, progress, driverOnline, driverLicence, realDriver: mine } = state;

  const busy = mine && status !== 'idle' && status !== 'done';
  const goDisabled = busy || (!driverOnline && !licenceOk(driverLicence));
  const badLicence = driverLicence !== '' && !licenceOk(driverLicence);

  return (
    <section className={`phone${visible ? ' show' : ''}`} id="driver" aria-label="Écran chauffeur">
      <div className="bar">
        Chauffeur <span className={`pill${driverOnline ? ' on' : ''}`}>{driverOnline ? 'En ligne' : 'Hors ligne'}</span>
      </div>

      <div className="body">
        <div className="card toggle">
          <div>
            <b>{driverOnline ? 'Vous recevez des courses' : 'Passez en ligne pour recevoir des courses'}</b>
            <div className="note">
              Gains aujourd&apos;hui : {money(state.earnings)} · {state.trips} course(s)
            </div>
          </div>
          <button
            type="button"
            className={`btn ${driverOnline ? 'btn-secondary' : 'btn-success'}`}
            disabled={goDisabled}
            onClick={actions.toggleOnline}
          >
            {driverOnline ? 'Pause' : 'Go'}
          </button>
        </div>

        {!driverOnline && (
          <div className="card">
            <label htmlFor="licence">Votre permis de conduire</label>
            <select
              id="licence"
              value={driverLicence}
              onChange={(e) => actions.setLicence(e.target.value as LicenceCode)}
            >
              {Object.entries(LICENCES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {badLicence ? (
              <div className="err hint">
                Un permis d&apos;apprenti ne suffit pas : il faut au minimum un G2 (Ontario) ou une classe 5 probatoire
                (Québec).
              </div>
            ) : (
              <div className="note hint">Minimum : G2 (Ontario) ou classe 5 probatoire (Québec).</div>
            )}
          </div>
        )}

        {o && driverOnline && status === 'searching' && (
          <>
            <MapView status={status} progress={progress} />
            <div className="card">
              <span className="pill warn">Nouvelle demande</span>
              <p className="request">
                <b>{o.pickup}</b> ({findSector(o.pickupSector)?.name}) → {o.dest} ({findSector(o.destSector)?.name})
              </p>
              <div className="muted">
                {o.km} km · ~{o.minutes} min · {o.car} · boîte {o.gearbox} · ⛽ {fuelLabel(o.fuel)}
              </div>
              <div className="big spaced">
                {money(o.price * DRIVER_SHARE)} <span className="note">pour vous (80 %)</span>
              </div>
            </div>
            <div className="row">
              <button type="button" className="btn btn-secondary" onClick={actions.refuse}>
                Refuser
              </button>
              <button type="button" className="btn btn-success" onClick={actions.accept}>
                Accepter
              </button>
            </div>
          </>
        )}

        {o && mine && status === 'enroute' && (
          <>
            <MapView status={status} progress={progress} />
            <ProgressEta label="Rejoignez le client" totalMinutes={o.eta} progress={progress} />
            <p className="muted">
              {o.pickup} · {o.car} · {o.plate} · boîte {o.gearbox}
            </p>
            <button type="button" className="btn btn-secondary" onClick={actions.skip}>
              ⏩ Je suis arrivé (démo)
            </button>
          </>
        )}

        {o && mine && status === 'arrived' && (
          <>
            <MapView status={status} progress={progress} />
            <div className="card">
              <b>Demandez le code au client</b>
              <p className="note">
                Ne démarrez jamais sans le bon code : il confirme que c&apos;est la bonne personne et la bonne voiture.
              </p>
              <input
                className="pin-input"
                inputMode="numeric"
                maxLength={4}
                placeholder="Code à 4 chiffres"
                aria-label="Code de sécurité du client"
                value={state.pinInput}
                onChange={(e) => actions.setPin(e.target.value)}
              />
              <label className="check">
                <input type="checkbox" checked={state.fuelOk} onChange={(e) => actions.setFuelOk(e.target.checked)} />
                J&apos;ai vérifié la jauge : au moins 1/4 (le client a déclaré {fuelLabel(o.fuel)})
              </label>
              {state.pinError && <div className="err">{state.pinError}</div>}
            </div>
            <button type="button" className="btn btn-success" onClick={actions.checkPin}>
              Démarrer la course
            </button>
            <button type="button" className="btn btn-danger" onClick={actions.lowFuel}>
              Carburant insuffisant : annuler
            </button>
          </>
        )}

        {o && mine && status === 'trip' && (
          <>
            <MapView status={status} progress={progress} />
            <ProgressEta label={`Vers ${o.dest}`} totalMinutes={o.minutes} progress={progress} />
            <button type="button" className="btn btn-secondary" onClick={actions.skip}>
              ⏩ Arriver à destination (démo)
            </button>
          </>
        )}

        {o && mine && status === 'dropoff' && (
          <>
            <MapView status={status} progress={progress} />
            <div className="card">
              <b>Garez la voiture et rendez les clés</b>
              <p className="note">Récupérez votre trottinette dans le coffre.</p>
            </div>
            <button type="button" className="btn btn-success" onClick={actions.finish}>
              Terminer la course
            </button>
          </>
        )}

        {o && mine && status === 'done' && (
          <div className="card center">
            <b>Course terminée ✅</b>
            <div className="big">+ {money(o.price * DRIVER_SHARE)}</div>
          </div>
        )}

        {!driverOnline && !busy && (
          <div className="card muted">
            Hors ligne. Choisissez votre permis, appuyez sur <b>Go</b>, puis commandez une course depuis le côté client
            pour la recevoir ici.
          </div>
        )}

        {driverOnline && !mine && status !== 'searching' && (
          <div className="card center">
            <div className="spinner" />
            <p className="muted">En attente de demandes…</p>
          </div>
        )}

        <div className="note footnote">
          Chauffeurs : permis G2 (ON) ou classe 5 probatoire (QC) minimum vérifié, antécédents judiciaires contrôlés,
          assurance de la plateforme pendant la course.
        </div>
      </div>
    </section>
  );
}
