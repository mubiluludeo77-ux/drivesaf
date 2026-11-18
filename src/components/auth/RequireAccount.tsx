'use client';

import Link from 'next/link';

import { useAuth } from '@/providers/AuthProvider';
import type { Account } from '@/types/account';

type Props = {
  /** Message affiché aux visiteurs non connectés */
  reason: string;
  children: (user: Account) => React.ReactNode;
};

/** Affiche la page seulement si un compte est connecté. */
export default function RequireAccount({ reason, children }: Props) {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="gate">
        <div className="spinner" aria-label="Chargement" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="gate">
        <div className="auth-card center">
          <h1>Connectez-vous</h1>
          <p className="muted">{reason}</p>
          <div className="hero-actions centered">
            <Link href="/connexion" className="btn btn-primary">Se connecter</Link>
            <Link href="/inscription" className="btn btn-secondary">Créer un compte</Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
