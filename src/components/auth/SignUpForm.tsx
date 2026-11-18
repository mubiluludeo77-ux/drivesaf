'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import OtpStep from '@/components/auth/OtpStep';
import { LICENCES, licenceOk } from '@/data/config';
import { findAccount, normalizePhone } from '@/lib/demoAuth';
import { useAuth } from '@/providers/AuthProvider';
import type { Account, AccountRole } from '@/types/account';
import type { LicenceCode } from '@/types/ride';

type Fields = {
  fullName: string;
  phone: string;
  email: string;
  licence: LicenceCode;
  licenceExpires: string;
  terms: boolean;
  background: boolean;
};

type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = {
  fullName: '',
  phone: '',
  email: '',
  licence: '',
  licenceExpires: '',
  terms: false,
  background: false,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function validate(f: Fields, role: AccountRole): Errors {
  const e: Errors = {};
  if (f.fullName.trim().length < 2) e.fullName = 'Entrez votre nom complet.';
  if (!normalizePhone(f.phone)) e.phone = 'Numéro canadien à 10 chiffres, par ex. 613 555-0101.';
  else if (findAccount(normalizePhone(f.phone)!)) e.phone = 'Un compte existe déjà avec ce numéro. Connectez-vous.';
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Adresse courriel invalide.';
  if (!f.terms) e.terms = 'Vous devez accepter les conditions pour continuer.';

  if (role === 'driver') {
    if (!f.licence) e.licence = 'Choisissez votre permis.';
    else if (!licenceOk(f.licence))
      e.licence = 'Un permis d’apprenti ne suffit pas : il faut au minimum un G2 (Ontario) ou une classe 5 probatoire (Québec).';
    if (!f.licenceExpires) e.licenceExpires = 'Indiquez la date d’expiration du permis.';
    else if (f.licenceExpires <= today()) e.licenceExpires = 'Ce permis est expiré.';
    if (!f.background) e.background = 'La vérification des antécédents est obligatoire pour conduire.';
  }
  return e;
}

export default function SignUpForm({ initialRole }: { initialRole: AccountRole }) {
  const router = useRouter();
  const { signUp } = useAuth();

  const [role, setRole] = useState<AccountRole>(initialRole);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [step, setStep] = useState<'form' | 'otp'>('form');

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate(fields, role);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep('otp');
    else document.getElementById(Object.keys(e)[0])?.focus();
  }

  function finish() {
    const phone = normalizePhone(fields.phone)!;
    const account: Account = {
      fullName: fields.fullName.trim(),
      phone,
      email: fields.email.trim(),
      role,
      createdAt: new Date().toISOString(),
      driver:
        role === 'driver'
          ? {
              licence: fields.licence,
              licenceProvince: fields.licence.startsWith('QC') ? 'QC' : 'ON',
              licenceExpires: fields.licenceExpires,
              status: 'pending',
            }
          : undefined,
    };
    signUp(account);
    router.push(role === 'driver' ? '/chauffeur' : '/commander');
  }

  const err = (key: keyof Fields) =>
    errors[key] ? (
      <div id={`${key}-error`} className="err hint" role="alert">
        {errors[key]}
      </div>
    ) : null;

  const aria = (key: keyof Fields) => ({
    id: key,
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
  });

  if (step === 'otp') {
    return <OtpStep phone={normalizePhone(fields.phone)!} onVerified={finish} onBack={() => setStep('form')} />;
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="segmented" role="radiogroup" aria-label="Type de compte">
        {(['client', 'driver'] as const).map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={role === r}
            className={role === r ? 'on' : ''}
            onClick={() => {
              setRole(r);
              setErrors({});
            }}
          >
            {r === 'client' ? 'Je veux être raccompagné' : 'Je veux conduire'}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="fullName">Nom complet</label>
        <input {...aria('fullName')} autoComplete="name" value={fields.fullName} onChange={(e) => set('fullName', e.target.value)} />
        {err('fullName')}
      </div>

      <div>
        <label htmlFor="phone">Téléphone mobile</label>
        <input
          {...aria('phone')}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="613 555-0101"
          value={fields.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
        {err('phone') ?? <div className="note hint">Vous recevrez un code par SMS pour confirmer.</div>}
      </div>

      <div>
        <label htmlFor="email">Courriel (facultatif, pour les reçus)</label>
        <input {...aria('email')} type="email" autoComplete="email" value={fields.email} onChange={(e) => set('email', e.target.value)} />
        {err('email')}
      </div>

      {role === 'driver' && (
        <fieldset className="fieldset">
          <legend>Votre permis de conduire</legend>
          <div className="row">
            <div>
              <label htmlFor="licence">Classe</label>
              <select {...aria('licence')} value={fields.licence} onChange={(e) => set('licence', e.target.value as LicenceCode)}>
                {Object.entries(LICENCES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="licenceExpires">Expire le</label>
              <input
                {...aria('licenceExpires')}
                type="date"
                min={today()}
                value={fields.licenceExpires}
                onChange={(e) => set('licenceExpires', e.target.value)}
              />
            </div>
          </div>
          {err('licence')}
          {err('licenceExpires')}
          <div className="note hint">
            Minimum : G2 (Ontario) ou classe 5 probatoire (Québec). Vous téléverserez la photo du permis après
            l’inscription.
          </div>
          <label className="check">
            <input
              type="checkbox"
              {...aria('background')}
              checked={fields.background}
              onChange={(e) => set('background', e.target.checked)}
            />
            J’accepte la vérification de mes antécédents judiciaires et de mon dossier de conduite.
          </label>
          {err('background')}
        </fieldset>
      )}

      <label className="check">
        <input type="checkbox" {...aria('terms')} checked={fields.terms} onChange={(e) => set('terms', e.target.checked)} />
        J’accepte les conditions d’utilisation et la politique de confidentialité.
      </label>
      {err('terms')}

      <button type="submit" className="btn btn-primary">
        Recevoir mon code
      </button>

      <p className="center muted">
        Déjà un compte ? <Link href="/connexion" className="link">Se connecter</Link>
      </p>
    </form>
  );
}
