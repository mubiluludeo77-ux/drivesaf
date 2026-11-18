import type { Account } from '@/types/account';

// ------------------------------------------------------------
// Comptes de DÉMONSTRATION, gardés dans le navigateur (localStorage).
// Remplacé par Supabase Auth (connexion par code SMS) au Sprint 2.
// ------------------------------------------------------------

const ACCOUNTS_KEY = 'drivesaf-demo-accounts';
const SESSION_KEY = 'drivesaf-demo-session';
const UPDATE_EVENT = 'drivesaf-auth-update';

/** En démo, le code SMS est toujours celui-ci (affiché à l'écran). */
export const DEMO_OTP = '123456';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // stockage bloqué (navigation privée)
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // stockage bloqué : la démo fonctionne seulement pour cette page
  }
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function readAccounts(): Account[] {
  try {
    const parsed = JSON.parse(read(ACCOUNTS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Ramène un numéro saisi (613 555-0101, +1 (613)…) au format +16135550101, ou null. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (ten.length !== 10 || ten[0] === '0' || ten[0] === '1') return null;
  return `+1${ten}`;
}

export function formatPhone(phone: string): string {
  const d = phone.replace(/^\+1/, '');
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function findAccount(phone: string): Account | undefined {
  return readAccounts().find((a) => a.phone === phone);
}

export function saveAccount(account: Account) {
  const others = readAccounts().filter((a) => a.phone !== account.phone);
  write(ACCOUNTS_KEY, JSON.stringify([...others, account]));
}

export function startSession(phone: string) {
  write(SESSION_KEY, phone);
}

export function endSession() {
  write(SESSION_KEY, null);
}

// --- Abonnement pour useSyncExternalStore -------------------
let cachedRaw: string | null | undefined;
let cachedAccount: Account | null = null;

export function getSessionSnapshot(): Account | null {
  const phone = read(SESSION_KEY);
  const raw = phone ? `${phone}|${read(ACCOUNTS_KEY)}` : null;
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedAccount = phone ? (findAccount(phone) ?? null) : null;
  }
  return cachedAccount;
}

export function getServerSessionSnapshot(): Account | null {
  return null;
}

export function subscribeSession(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === SESSION_KEY || e.key === ACCOUNTS_KEY) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(UPDATE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(UPDATE_EVENT, onChange);
  };
}
