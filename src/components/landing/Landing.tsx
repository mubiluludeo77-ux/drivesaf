import Link from 'next/link';
import { FiCheckCircle, FiKey, FiMapPin, FiPhoneCall, FiShield, FiUserCheck } from 'react-icons/fi';

import { REASONS, SECTORS } from '@/data/config';
import { estimate, money } from '@/utils/pricing';
import type { RideForm } from '@/types/ride';

const STEPS = [
  { title: 'Vous commandez', text: 'Indiquez où est votre voiture, où vous allez, et voyez le prix tout de suite.' },
  { title: 'Un chauffeur arrive', text: 'Il vient à pied ou en trottinette pliante, qu’il range dans votre coffre.' },
  { title: 'Vous vérifiez', text: 'Photo, nom et permis affichés. Vous lui donnez votre code de sécurité à 4 chiffres.' },
  { title: 'Il vous ramène', text: 'Dans votre propre voiture, jusqu’à chez vous. Il gare la voiture et vous rend les clés.' },
];

const SAFETY = [
  { icon: FiUserCheck, title: 'Chauffeurs vérifiés', text: 'Permis G2 (Ontario) ou classe 5 probatoire (Québec) minimum, antécédents judiciaires contrôlés.' },
  { icon: FiKey, title: 'Code de sécurité', text: 'La course ne démarre qu’avec le code à 4 chiffres que vous seul connaissez.' },
  { icon: FiPhoneCall, title: 'Bouton SOS', text: 'Appel au 911 et envoi de votre position en un geste, pendant toute la course.' },
  { icon: FiShield, title: 'Trajet partagé', text: 'Envoyez un lien de suivi en direct à un proche.' },
];

// Exemples de prix en journée (calculés avec les vrais tarifs de l'app)
const EXAMPLES: [string, string][] = [
  ['byward', 'aylmer'],
  ['hull', 'orleans'],
  ['kanata', 'byward'],
];
const DAYTIME = new Date('2026-11-18T14:00:00-05:00');

function example(from: string, to: string) {
  const form: RideForm = {
    pickup: '', dest: '', car: '', plate: '', gearbox: 'auto', reason: REASONS[0], fuel: '',
    pickupSector: from, destSector: to,
  };
  return estimate(form, DAYTIME);
}

const sectorName = (id: string) => SECTORS.find((s) => s.id === id)?.name ?? id;

export default function Landing() {
  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="wrap">
          <span className="hero-tag">
            <FiMapPin aria-hidden="true" /> Ottawa–Gatineau
          </span>
          <h1>Trop bu ? Trop fatigué ?<br />On vous ramène, dans votre voiture.</h1>
          <p className="hero-lead">
            DriveSAF envoie un chauffeur vérifié qui conduit <b>votre propre voiture</b> jusqu’à chez vous.
            Vous rentrez en sécurité, et votre voiture aussi.
          </p>
          <div className="hero-actions">
            <Link href="/commander" className="btn btn-primary">Commander un chauffeur</Link>
            <Link href="/inscription?role=chauffeur" className="btn btn-secondary">Devenir chauffeur</Link>
          </div>
          <ul className="hero-points">
            <li><FiCheckCircle aria-hidden="true" /> Prix affiché avant de commander</li>
            <li><FiCheckCircle aria-hidden="true" /> Les deux rives de la rivière</li>
            <li><FiCheckCircle aria-hidden="true" /> 7 jours sur 7, surtout la nuit</li>
          </ul>
        </div>
      </section>

      {/* ---------- Comment ça marche ---------- */}
      <section className="section" id="fonctionnement">
        <div className="wrap">
          <h2>Comment ça marche</h2>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Tarifs ---------- */}
      <section className="section section-muted" id="tarifs">
        <div className="wrap">
          <h2>Tarifs</h2>
          <p className="section-lead">
            <b>25 $</b> de prise en charge + <b>2,10 $/km</b>. +20 % de 22 h à 6 h. Taxes en sus : TVH 13 % au départ
            d’Ottawa, TPS + TVQ 14,975 % au départ de Gatineau.
          </p>
          <div className="price-grid">
            {EXAMPLES.map(([from, to]) => {
              const e = example(from, to);
              return (
                <div key={`${from}-${to}`} className="price-card">
                  <div className="muted">{sectorName(from)} → {sectorName(to)}</div>
                  <div className="price-card-total">{money(e.total)}</div>
                  <div className="note">
                    {e.km} km · ~{e.minutes} min · taxes incluses, de jour
                  </div>
                </div>
              );
            })}
          </div>
          <p className="note">Votre voiture doit avoir au moins 1/4 de réservoir (ou 25 % de batterie).</p>
        </div>
      </section>

      {/* ---------- Sécurité ---------- */}
      <section className="section" id="securite">
        <div className="wrap">
          <h2>Votre sécurité d’abord</h2>
          <div className="feature-grid">
            {SAFETY.map(({ icon: Icon, title, text }) => (
              <div key={title} className="feature">
                <Icon className="feature-icon" aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Zone ---------- */}
      <section className="section section-muted" id="zone">
        <div className="wrap">
          <h2>Où sommes-nous ?</h2>
          <div className="zone-grid">
            <div>
              <h3>Ottawa (Ontario)</h3>
              <p>{SECTORS.filter((s) => s.province === 'ON').map((s) => s.name).join(' · ')}</p>
            </div>
            <div>
              <h3>Gatineau (Québec)</h3>
              <p>{SECTORS.filter((s) => s.province === 'QC').map((s) => s.name).join(' · ')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Appel à l'action ---------- */}
      <section className="section">
        <div className="wrap cta">
          <h2>Prêt à rentrer en toute sécurité ?</h2>
          <p>Créez votre compte en une minute avec votre numéro de téléphone.</p>
          <div className="hero-actions">
            <Link href="/inscription" className="btn btn-primary">Créer mon compte</Link>
            <Link href="/demo" className="btn btn-secondary">Voir la démo</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
