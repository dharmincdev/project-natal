'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import AuthModal from './AuthModal';
import { LogOut, User as UserIcon, Cloud } from 'lucide-react';

export default function UserNav() {
  const { user, profile, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const displayName =
    profile?.name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Member';

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {user ? (
          <div className="flex items-center gap-1.5">
            <div
              data-testid="user-session-badge"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium"
              title={`Signed in as ${user.email || displayName}`}
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-semibold truncate max-w-[110px]">{displayName}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-xs h-7 sm:h-8 px-2 text-muted-foreground hover:text-foreground"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="header-signin-btn"
            onClick={() => setIsAuthModalOpen(true)}
            className="text-xs h-7 sm:h-8 px-2 sm:px-2.5 font-semibold gap-1.5 shadow-2xs shrink-0"
            title="Sign in to save trees to the cloud"
          >
            <UserIcon className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Sign In</span>
          </Button>
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
