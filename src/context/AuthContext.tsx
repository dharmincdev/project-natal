'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ProfileRow } from '@/lib/supabase/db';

type AuthContextType = {
  user: User | null;
  profile: ProfileRow | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setIsLoading(false);
      return;
    }

    // Initial session lookup
    client.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user);
      }
      setIsLoading(false);
    });

    // Subscribe to auth state updates
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOtp = async (email: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return { error: new Error('Supabase is not configured.') };
    }

    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async () => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return { error: new Error('Supabase is not configured.') };
    }

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    const client = getSupabaseBrowserClient();
    if (client) {
      await client.auth.signOut();
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
