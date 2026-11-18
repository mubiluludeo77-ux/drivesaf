import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';

import Header from '@/components/header/Header';

import { RideProvider } from '@/providers/RideProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

import './globals.css';

export const metadata: Metadata = {
  title: 'DriveSAF — Chauffeur de remplacement à Ottawa–Gatineau',
  description:
    'Un chauffeur vient à vous et vous ramène dans votre propre voiture quand vous ne pouvez pas conduire. Ottawa–Gatineau.',
};

// Polices hébergées par Next.js (pas de requête vers Google chez le visiteur)
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-CA" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <ThemeProvider>
          <RideProvider>
            <Header />
            {children}
          </RideProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
