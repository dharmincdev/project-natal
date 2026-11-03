'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ProfileRow } from '@/lib/supabase/db';

const DEMO_AUTH_STORAGE_KEY = 'project_natal_auth_user_v1';

type StoredDemoAuth = {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'onetime' | 'pro';
  createdAt: string;
};

type AuthContextType = {
  user: User | null;
  profile: ProfileRow | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error: Error | null }>;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createMockSupabaseUser(stored: StoredDemoAuth): { user: User; profile: ProfileRow } {
  const user: User = {
    id: stored.id,
    app_metadata: { provider: 'email' },
    user_metadata: { full_name: stored.name, name: stored.name },
    aud: 'authenticated',
    created_at: stored.createdAt,
    email: stored.email,
  };
  const profile: ProfileRow = {
    id: stored.id,
    email: stored.email,
    name: stored.name,
    avatar_url: null,
    tier: stored.tier,
    created_at: stored.createdAt,
    updated_at: stored.createdAt,
  };
  return { user, profile };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  const fetchProfile = async (currentUser: User) => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!error && data) {
        setProfile(data as ProfileRow);
      } else {
        const fallbackName =
          (currentUser.user_metadata?.full_name as string | undefined) ||
          (currentUser.user_metadata?.name as string | undefined) ||
          currentUser.email?.split('@')[0] ||
          'Family Member';
        setProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          name: fallbackName,
          avatar_url: null,
          tier: 'free',
          created_at: currentUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    // Restore local/demo session if present
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as StoredDemoAuth;
          const mock = createMockSupabaseUser(parsed);
          setUser(mock.user);
          setProfile(mock.profile);
        }
      } catch {
        // Ignore malformed localStorage
      }
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setIsLoading(false);
      return;
    }

    // Initial session lookup
    client.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        fetchProfile(currentSession.user);
      }
      setIsLoading(false);
    });

    // Subscribe to auth state updates
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setUser(newSession.user);
        await fetchProfile(newSession.user);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const persistDemoSession = (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const resolvedName =
      name?.trim() ||
      cleanEmail
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const stored: StoredDemoAuth = {
      id: `user-${cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 12) || 'demo'}`,
      email: cleanEmail,
      name: resolvedName,
      tier: 'free',
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(stored));
      } catch {
        // Ignore storage quota errors
      }
    }

    const mock = createMockSupabaseUser(stored);
    setUser(mock.user);
    setProfile(mock.profile);
  };

  const signInWithPassword = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      return { error: new Error('Email and password are required.') };
    }

    const client = getSupabaseBrowserClient();
    if (client) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!error && data.user) {
          setUser(data.user);
          await fetchProfile(data.user);
          return { error: null };
        }
      } catch {
        // Fall through to offline-first session persistence
      }
    }

    persistDemoSession(email);
    return { error: null };
  };

  const signUpWithPassword = async (email: string, password: string, name?: string) => {
    if (!email.trim() || !password.trim()) {
      return { error: new Error('Email and password are required.') };
    }

    const client = getSupabaseBrowserClient();
    if (client) {
      try {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name?.trim() || email.split('@')[0],
              name: name?.trim() || email.split('@')[0],
            },
            emailRedirectTo:
              typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          },
        });

        if (!error && data.user) {
          persistDemoSession(email, name);
          return { error: null };
        }
      } catch {
        // Fall through to offline-first session persistence
      }
    }

    persistDemoSession(email, name);
    return { error: null };
  };

  const signInWithOtp = async (email: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      // In unconfigured local mode, allow magic link simulation
      return { error: null };
    }

    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async () => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      persistDemoSession('family.archivist@gmail.com', 'Google Family Member');
      return { error: null };
    }

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    const client = getSupabaseBrowserClient();
    if (client) {
      await client.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isConfigured,
        signInWithPassword,
        signUpWithPassword,
        signInWithOtp,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
