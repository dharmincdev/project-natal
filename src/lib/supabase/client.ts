import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

let supabaseBrowserClient: SupabaseClient | null = null;

/**
 * Returns true if real Supabase environment variables are configured.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    anonKey &&
    !url.includes('your-project-ref') &&
    anonKey !== 'your-anon-key-here'
  );
}

/**
 * Creates or retrieves the singleton browser-side Supabase client.
 * Returns null if Supabase credentials are not yet configured.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return supabaseBrowserClient;
}
