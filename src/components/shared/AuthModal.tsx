'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  title = 'Sign In to Project Natal',
  description = 'Save your family trees to the cloud, access them on any device, and collaborate with relatives.',
}: AuthModalProps) {
  const { signInWithOtp, signInWithGoogle, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await signInWithOtp(email.trim());

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setMagicLinkSent(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setErrorMessage(null);

    const { error } = await signInWithGoogle();

    if (error) {
      setErrorMessage(error.message);
      setIsGoogleSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setMagicLinkSent(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌳</span>
            <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        {!isConfigured ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 space-y-2">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              Supabase Credentials Needed
            </div>
            <p className="leading-relaxed">
              To activate cloud sync & user sign-in, add your Supabase URL & Anon Key to your <code className="px-1 py-0.5 rounded bg-background font-mono text-[11px]">.env.local</code> file.
            </p>
          </div>
        ) : magicLinkSent ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-foreground">Magic Link Sent!</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We just sent a secure sign-in link to <strong className="text-foreground">{email}</strong>. Check your inbox to complete sign in.
            </p>
            <Button variant="outline" size="sm" onClick={handleClose} className="mt-2 text-xs">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Google One-Click Sign In */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || isSubmitting}
              className="w-full h-10 gap-2 text-xs font-semibold hover:bg-muted/50 border-border"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleSubmitting ? 'Connecting...' : 'Continue with Google'}</span>
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <span className="relative bg-card px-2 text-[10px] uppercase font-semibold text-muted-foreground">
                Or passwordless magic link
              </span>
            </div>

            {/* Email Magic Link Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-[11px] text-destructive flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full h-9 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs"
              >
                <span>{isSubmitting ? 'Sending...' : 'Send Magic Link'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </form>

            <div className="pt-2 border-t flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero passwords. Your data stays strictly private under RLS.</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
