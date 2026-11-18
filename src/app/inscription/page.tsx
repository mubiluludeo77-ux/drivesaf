import type { Metadata } from 'next';

import AuthCard from '@/components/auth/AuthCard';
import SignUpForm from '@/components/auth/SignUpForm';

export const metadata: Metadata = {
  title: 'Inscription — DriveSAF',
  description: 'Créez votre compte DriveSAF pour être raccompagné ou pour devenir chauffeur à Ottawa–Gatineau.',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { role } = await searchParams;

  return (
    <AuthCard title="Créer un compte" subtitle="Une minute, avec votre numéro de téléphone.">
      <SignUpForm initialRole={role === 'chauffeur' ? 'driver' : 'client'} />
    </AuthCard>
  );
}
