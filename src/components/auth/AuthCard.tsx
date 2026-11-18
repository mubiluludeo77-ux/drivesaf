type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

/** Mise en page commune des pages Inscription et Connexion. */
export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
        {children}
      </div>
    </main>
  );
}
