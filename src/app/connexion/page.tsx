import type { Metadata } from 'next';

import AuthCard from '@/components/auth/AuthCard';
import SignInForm from '@/components/auth/SignInForm';

export const metadata: Metadata = {
  title: 'Connexion — DriveSAF',
  description: 'Connectez-vous à DriveSAF avec votre numéro de téléphone.',
};

export default function Page() {
  return (
    <AuthCard title="Connexion" subtitle="Nous vous envoyons un code par SMS.">
      <SignInForm />
    </AuthCard>
  );
}
