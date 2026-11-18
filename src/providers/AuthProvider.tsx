'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';

import {
  endSession,
  getServerSessionSnapshot,
  getSessionSnapshot,
  saveAccount,
  startSession,
  subscribeSession,
} from '@/lib/demoAuth';
import type { Account } from '@/types/account';

type AuthContextValue = {
  /** null = pas connecté (ou page pas encore chargée dans le navigateur) */
  user: Account | null;
  /** false pendant le rendu serveur : évite d'afficher « connectez-vous » à tort */
  ready: boolean;
  signUp: (account: Account) => void;
  signIn: (phone: string) => void;
  signOut: () => void;
  /** Démo : simule l'approbation du dossier chauffeur par un admin */
  approveDriverDemo: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const subscribeNothing = () => () => {};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);

  const value: AuthContextValue = {
    user,
    ready,
    signUp: (account) => {
      saveAccount(account);
      startSession(account.phone);
    },
    signIn: (phone) => startSession(phone),
    signOut: () => endSession(),
    approveDriverDemo: () => {
      if (user?.driver) saveAccount({ ...user, driver: { ...user.driver, status: 'approved' } });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
