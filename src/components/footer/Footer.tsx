import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer-inner">
        <div>
          <b>DriveSAF</b> · Chauffeur de remplacement à Ottawa–Gatineau
        </div>
        <nav aria-label="Liens du pied de page">
          <Link href="/#tarifs">Tarifs</Link>
          <Link href="/#securite">Sécurité</Link>
          <Link href="/inscription?role=chauffeur">Devenir chauffeur</Link>
        </nav>
        <div className="note">Urgence : composez le 911. Prototype de démonstration.</div>
      </div>
    </footer>
  );
}
