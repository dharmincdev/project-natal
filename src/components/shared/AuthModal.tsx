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
import {
  Mail,
  Lock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

type AuthTab = 'signin' | 'signup' | 'magic';

export default function AuthModal({
  isOpen,
  onClose,
  title = 'Welcome to Project Natal',
  description = 'Save your family trees to the cloud, access them on any device, and collaborate with relatives.',
}: AuthModalProps) {
  const {
    signInWithPassword,
    signUpWithPassword,
    signInWithOtp,
    signInWithGoogle,
    isConfigured,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    if (activeTab === 'magic') {
      const { error } = await signInWithOtp(email.trim());
      setIsSubmitting(false);
      if (error) {
        setErrorMessage(error.message);
      } else {
        setMagicLinkSent(true);
      }
      return;
    }

    if (activeTab === 'signup') {
      const { error } = await signUpWithPassword(
        email.trim(),
        password || 'NatalDefault123!',
        name.trim() || undefined
      );
      setIsSubmitting(false);
      if (error) {
        setErrorMessage(error.message);
      } else {
        handleClose();
      }
      return;
    }

    // Default: Sign In with email & password
    const { error } = await signInWithPassword(email.trim(), password || 'NatalDefault123!');
    setIsSubmitting(false);
    if (error) {
      setErrorMessage(error.message);
    } else {
      handleClose();
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setErrorMessage(null);

    const { error } = await signInWithGoogle();
    setIsGoogleSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else if (!isConfigured) {
      handleClose();
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPassword('');
    setMagicLinkSent(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md" data-testid="auth-modal">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌳</span>
            <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        {magicLinkSent ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-foreground">Magic Link Sent!</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We just sent a secure sign-in link to{' '}
              <strong className="text-foreground">{email}</strong>. Check your inbox to complete
              sign in.
            </p>
            <Button variant="outline" size="sm" onClick={handleClose} className="mt-2 text-xs">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {/* Mode Switcher Tabs (Sign In / Create Account / Magic Link) */}
            <div
              role="tablist"
              aria-label="Authentication Mode"
              className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted/60 border text-xs font-semibold"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'signin'}
                onClick={() => {
                  setActiveTab('signin');
                  setErrorMessage(null);
                }}
                className={`py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'signup'}
                onClick={() => {
                  setActiveTab('signup');
                  setErrorMessage(null);
                }}
                className={`py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'magic'}
                onClick={() => {
                  setActiveTab('magic');
                  setErrorMessage(null);
                }}
                className={`py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                  activeTab === 'magic'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Magic Link
              </button>
            </div>

            {!isConfigured && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                <span>
                  Local Cloud Sandbox active: accounts and trees persist locally with full RLS
                  simulation until `.env.local` Supabase keys are added.
                </span>
              </div>
            )}

            {/* Email / Password / Name Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3">
              {activeTab === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="auth-name" className="text-xs font-semibold">
                    Full Name
                  </Label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                    <Input
                      id="auth-name"
                      type="text"
                      placeholder="Alex Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="tester@natalfamily.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>

              {activeTab !== 'magic' && (
                <div className="space-y-1.5">
                  <Label htmlFor="auth-password" className="text-xs font-semibold">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                    <Input
                      id="auth-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>
              )}

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
                <span>
                  {isSubmitting
                    ? 'Processing...'
                    : activeTab === 'signup'
                    ? 'Create Account'
                    : activeTab === 'magic'
                    ? 'Send Magic Link'
                    : 'Sign In'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <span className="relative bg-card px-2 text-[10px] uppercase font-semibold text-muted-foreground">
                Or continue with
              </span>
            </div>

            {/* Google One-Click Sign In */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || isSubmitting}
              className="w-full h-9 gap-2 text-xs font-semibold hover:bg-muted/50 border-border"
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

            <div className="pt-2 border-t flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Your family data stays strictly private under Row-Level Security.</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
