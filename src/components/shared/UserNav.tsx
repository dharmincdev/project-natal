'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import AuthModal from './AuthModal';
import { LogIn, LogOut, User as UserIcon, Cloud, CloudOff } from 'lucide-react';

export default function UserNav() {
  const { user, profile, signOut, isConfigured } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium">
              <Cloud className="w-3 h-3 text-emerald-500" />
              <span className="hidden sm:inline font-semibold">
                {profile?.name || user.email?.split('@')[0]}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAuthModalOpen(true)}
            className="text-xs h-8 px-2.5 sm:px-3 font-semibold gap-1.5 shadow-2xs"
            title="Sign in to save trees to the cloud"
          >
            <UserIcon className="w-3.5 h-3.5 text-primary" />
            <span>Sign In</span>
          </Button>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
