'use client';

import { useState } from 'react';

import { DEMO_OTP, formatPhone } from '@/lib/demoAuth';

type Props = {
  phone: string;
  onVerified: () => void;
  onBack: () => void;
};

/** Étape 2 : saisie du code reçu par SMS (simulé en démo). */
export default function OtpStep({ phone, onVerified, onBack }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code === DEMO_OTP) onVerified();
    else setError('Code incorrect. Vérifiez le SMS et réessayez.');
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <p>
        Nous avons envoyé un code à 6 chiffres au <b>{formatPhone(phone)}</b>.
      </p>
      <div className="demo-note">Démo : aucun SMS n’est envoyé. Le code est <b>{DEMO_OTP}</b>.</div>
      <div>
        <label htmlFor="otp">Code reçu par SMS</label>
        <input
          id="otp"
          className="pin-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ''));
            setError('');
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'otp-error' : undefined}
        />
        {error && (
          <div id="otp-error" className="err hint" role="alert">
            {error}
          </div>
        )}
      </div>
      <button type="submit" className="btn btn-primary" disabled={code.length !== 6}>
        Vérifier
      </button>
      <button type="button" className="btn btn-secondary" onClick={onBack}>
        Modifier le numéro
      </button>
    </form>
  );
}
