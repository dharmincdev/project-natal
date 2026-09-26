'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      router.replace('/dashboard');
      return;
    }

    client.auth.getSession().then(() => {
      router.replace('/dashboard');
    });
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-muted-foreground font-medium">Completing sign-in & syncing your trees...</p>
    </div>
  );
}
