'use client';

import RequireAccount from '@/components/auth/RequireAccount';
import ClientScreen from '@/components/client/ClientScreen';

export default function CommanderView() {
  return (
    <RequireAccount reason="Pour commander un chauffeur, connectez-vous ou créez un compte (une minute).">
      {(user) => (
        <main>
          <div className="wrap page-head">
            <h1>Bonjour {user.fullName.split(' ')[0]} 👋</h1>
            <p className="muted">Où êtes-vous, et où voulez-vous aller ?</p>
          </div>
          <div className="screens">
            <ClientScreen visible />
          </div>
        </main>
      )}
    </RequireAccount>
  );
}
