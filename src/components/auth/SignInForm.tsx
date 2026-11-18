'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import OtpStep from '@/components/auth/OtpStep';
import { findAccount, normalizePhone } from '@/lib/demoAuth';
import { useAuth } from '@/providers/AuthProvider';

export default function SignInForm() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizePhone(phone);
    if (!normalized) return setError('Numéro canadien à 10 chiffres, par ex. 613 555-0101.');
    if (!findAccount(normalized)) return setError('Aucun compte avec ce numéro. Créez-en un.');
    setVerified(normalized);
  }

  if (verified) {
    return (
      <OtpStep
        phone={verified}
        onBack={() => setVerified(null)}
        onVerified={() => {
          const account = findAccount(verified);
          signIn(verified);
          router.push(account?.role === 'driver' ? '/chauffeur' : '/commander');
        }}
      />
    );
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div>
        <label htmlFor="phone">Téléphone mobile</label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="613 555-0101"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setError('');
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'phone-error' : undefined}
        />
        {error && (
          <div id="phone-error" className="err hint" role="alert">
            {error}
          </div>
        )}
      </div>
      <button type="submit" className="btn btn-primary">
        Recevoir mon code
      </button>
      <p className="center muted">
        Pas encore de compte ? <Link href="/inscription" className="link">Créer un compte</Link>
      </p>
    </form>
  );
}
