import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminClient: SupabaseClient | null = null;

/**
 * Returns true if real Supabase admin credentials (SERVICE_ROLE_KEY) are configured.
 */
export function isSupabaseAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return Boolean(
    url &&
    serviceKey &&
    !url.includes('your-project-ref') &&
    serviceKey !== 'your-service-role-key-here'
  );
}

/**
 * Creates or retrieves the singleton admin-side Supabase client.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass Row-Level Security for system operations (webhooks, etc.).
 * Returns null if Supabase admin credentials are not configured.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  if (!supabaseAdminClient) {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    supabaseAdminClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdminClient;
}
