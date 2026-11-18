'use client';

import ClientForm from '@/components/client/ClientForm';
import DriverCard from '@/components/common/DriverCard';
import MapView from '@/components/common/MapView';
import ProgressEta from '@/components/common/ProgressEta';
import { useRide } from '@/providers/RideProvider';
import { money } from '@/utils/pricing';
import type { RideStatus } from '@/types/ride';

const STATUS_LABEL: Record<RideStatus, string> = {
  idle: '',
  searching: 'Recherche…',
  enroute: 'Chauffeur en route',
  arrived: 'Chauffeur arrivé',
  trip: 'Trajet en cours',
  dropoff: 'Arrivé',
  done: 'Terminé',
};

export default function ClientScreen({ visible }: { visible: boolean }) {
  const { state, actions } = useRide();
  const { status, order: o, progress } = state;
  const showSos = status === 'enroute' || status === 'arrived' || status === 'trip';

  return (
    <section className={`phone${visible ? ' show' : ''}`} id="client" aria-label="Écran client">
      <div className="bar">
        Client <small>{STATUS_LABEL[status]}</small>
      </div>

      <div className="body">
        <div className="mapwrap">
          <MapView status={status} progress={progress} />
          {showSos && (
            <button
              type="button"
              className="btn btn-danger sos"
              onClick={() => alert('Démo : appel du 911 et envoi de votre position au service sécurité.')}
            >
              SOS
            </button>
          )}
        </div>

        {status === 'idle' && <ClientForm />}

        {status === 'searching' && (
          <>
            <div className="card center">
              <div className="spinner" />
              <p>
                <b>Recherche d&apos;un chauffeur à proximité…</b>
              </p>
              <p className="note">
                {state.driverOnline
                  ? 'Un chauffeur en ligne reçoit votre demande (voir côté chauffeur).'
                  : 'Démo : un chauffeur simulé va accepter dans quelques secondes.'}
              </p>
            </div>
            <button type="button" className="btn btn-danger" onClick={actions.cancel}>
              Annuler
            </button>
          </>
        )}

        {o?.driver && status === 'enroute' && (
          <>
            <DriverCard driver={o.driver} />
            <ProgressEta label="Arrivée du chauffeur" totalMinutes={o.eta} progress={progress} />
            <div className="card">
              <div className="muted">Votre code de sécurité</div>
              <div className="pin">{o.pin}</div>
              <div className="note">Donnez ce code au chauffeur seulement s&apos;il est bien celui affiché ci-dessus.</div>
            </div>
            <button type="button" className="btn btn-danger" onClick={actions.cancel}>
              Annuler la course
            </button>
          </>
        )}

        {o?.driver && status === 'arrived' && (
          <>
            <DriverCard driver={o.driver} />
            <div className="card center">
              <b>Votre chauffeur est arrivé 👋</b>
              <p className="muted">Vérifiez son identité puis donnez-lui le code :</p>
              <div className="pin">{o.pin}</div>
            </div>
          </>
        )}

        {o?.driver && status === 'trip' && (
          <>
            <DriverCard driver={o.driver} />
            <ProgressEta label={`En route vers ${o.dest}`} totalMinutes={o.minutes} progress={progress} />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => alert('Démo : lien de suivi en direct envoyé à votre proche.')}
            >
              Partager mon trajet avec un proche
            </button>
          </>
        )}

        {status === 'dropoff' && (
          <div className="card center">
            <b>Vous êtes arrivé 🏠</b>
            <p className="muted">Le chauffeur gare votre voiture et vous rend les clés.</p>
          </div>
        )}

        {o?.driver && status === 'done' && (
          <>
            <div className="card">
              <div className="price">
                <span>Course terminée</span>
                <span className="big">{money(o.total)}</span>
              </div>
              <div className="muted">
                {o.km} km · {o.car} ({o.plate}) · payé par carte
              </div>
            </div>
            <div className="card center">
              <div>Notez {o.driver.name}</div>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={n <= state.rating ? 'on' : ''}
                    aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                    onClick={() => actions.rate(n)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={actions.cancel}>
              Nouvelle course
            </button>
          </>
        )}
      </div>
    </section>
  );
}
