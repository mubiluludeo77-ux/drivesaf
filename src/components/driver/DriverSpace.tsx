'use client';

import Link from 'next/link';
import { FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';

import RequireAccount from '@/components/auth/RequireAccount';
import DriverScreen from '@/components/driver/DriverScreen';
import { LICENCES } from '@/data/config';
import { useAuth } from '@/providers/AuthProvider';

export default function DriverSpace() {
  const { approveDriverDemo } = useAuth();

  return (
    <RequireAccount reason="L’espace chauffeur est réservé aux chauffeurs inscrits.">
      {(user) => {
        if (user.role !== 'driver' || !user.driver) {
          return (
            <div className="gate">
              <div className="auth-card center">
                <h1>Compte client</h1>
                <p className="muted">
                  Votre compte sert à être raccompagné. Pour conduire avec DriveSAF, il faut un compte chauffeur
                  (avec un autre numéro de téléphone).
                </p>
                <div className="hero-actions centered">
                  <Link href="/commander" className="btn btn-primary">Commander un chauffeur</Link>
                </div>
              </div>
            </div>
          );
        }

        if (user.driver.status === 'pending') {
          return (
            <main className="wrap page-head">
              <h1>Dossier en cours de vérification</h1>
              <p className="muted">
                Merci {user.fullName.split(' ')[0]} ! Vous pourrez passer en ligne dès que votre dossier sera approuvé.
              </p>
              <ol className="checklist">
                <li className="done">
                  <FiCheckCircle aria-hidden="true" /> Compte créé, téléphone vérifié
                </li>
                <li className="done">
                  <FiCheckCircle aria-hidden="true" /> Permis déclaré : {LICENCES[user.driver.licence]}, expire le{' '}
                  {user.driver.licenceExpires}
                </li>
                <li>
                  <FiFileText aria-hidden="true" /> Photo du permis (recto / verso) — à venir
                </li>
                <li>
                  <FiClock aria-hidden="true" /> Vérification des antécédents et du dossier de conduite
                </li>
              </ol>
              <div className="demo-note">
                Démo : en vrai, un administrateur approuve le dossier.{' '}
                <button type="button" className="btn btn-secondary btn-small" onClick={approveDriverDemo}>
                  Simuler l’approbation
                </button>
              </div>
            </main>
          );
        }

        return (
          <main>
            <div className="wrap page-head">
              <h1>Espace chauffeur</h1>
              <p className="muted">
                Passez en ligne pour recevoir des courses. Astuce démo : commandez depuis la page{' '}
                <Link href="/commander" className="link">Commander</Link> avec un autre compte, ou utilisez la{' '}
                <Link href="/demo" className="link">démo</Link>.
              </p>
            </div>
            <div className="screens">
              <DriverScreen visible lockedLicence={user.driver.licence} />
            </div>
          </main>
        );
      }}
    </RequireAccount>
  );
}
