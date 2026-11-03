import { createServerClient } from '@supabase/ssr';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isSupabaseConfigured } from './client';

/**
 * Creates a server-side Supabase client using @supabase/ssr and Next.js 16 async cookies().
 * Returns null if Supabase credentials are not configured.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method may be called from a Server Component.
            // This can be safely ignored when middleware refreshes user sessions.
          }
        },
      },
    }
  );
}

/**
 * Retrieves the currently authenticated Supabase user on the server side.
 * Uses auth.getUser() to validate the JWT with the Supabase Auth server.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

