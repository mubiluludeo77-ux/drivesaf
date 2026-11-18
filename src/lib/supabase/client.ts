import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Valeurs publiques du projet Supabase (Paramètres → API).
// La clé « publishable » peut être exposée au navigateur : la sécurité
// repose sur les règles RLS de supabase/migrations/*_security.sql.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && publishableKey);
}

/** Client Supabase unique pour le navigateur. Lève une erreur claire si .env.local manque. */
export function getSupabase(): SupabaseClient {
  if (!url || !publishableKey) {
    throw new Error(
      'Supabase n’est pas configuré : copiez .env.example vers .env.local et remplissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  client ??= createClient(url, publishableKey);
  return client;
}
