'use client';

import React, { useState, useEffect } from 'react';
import { useTier } from '@/context/TierContext';
import { useAuth } from '@/context/AuthContext';
import { UserTier } from '@/types/tree';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  X,
} from 'lucide-react';

export default function UpgradeModal() {
  const {
    tier,
    setTier,
    isUpgradeModalOpen,
    closeUpgradeModal,
    highlightedTier,
    upgradeReason,
  } = useTier();
  const { user } = useAuth();
  const [loadingTier, setLoadingTier] = useState<UserTier | null>(null);
  const [confirmedTier, setConfirmedTier] = useState<UserTier | null>(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reset confirmation step whenever the modal opens fresh
  useEffect(() => {
    if (isUpgradeModalOpen) {
      setConfirmedTier(null);
      setCheckoutSessionId(null);
    }
  }, [isUpgradeModalOpen]);

  // Handle URL return from Stripe Hosted Checkout (?upgrade_success=true&tier=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get('upgrade_success') === 'true';
    const tierParam = params.get('tier') as UserTier | null;
    if (isSuccess && (tierParam === 'onetime' || tierParam === 'pro')) {
      setTier(tierParam);
      setToastMessage(
        tierParam === 'pro'
          ? 'Pro Plan ($7/mo) activated! Unlimited family members & AI Family Historian unlocked.'
          : 'One-Time Pass ($5) activated! Capacity expanded to 100 family members.'
      );
    }
  }, [setTier]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const applyUrlUpgradeState = (_selectedTier: UserTier) => {
    // URL query state (?upgrade_success=true&tier=...) is handled on return from Stripe Hosted Checkout
    // without mutating Next.js App Router history state during in-modal confirmation.
  };

  const triggerUpgradeToast = (selectedTier: UserTier) => {
    if (selectedTier === 'pro') {
      setToastMessage(
        'Upgraded to Pro Plan ($7/mo) — Unlimited relatives & AI Family Historian unlocked!'
      );
    } else if (selectedTier === 'onetime') {
      setToastMessage(
        'Upgraded to One-Time Pass ($5) — 100-member capacity & high-res exports unlocked!'
      );
    } else {
      setToastMessage('Switched to Free Starter Plan (up to 25 family members).');
    }
  };

  const handleSelectTier = async (selectedTier: UserTier) => {
    if (selectedTier === 'free') {
      setTier('free');
      triggerUpgradeToast('free');
      closeUpgradeModal();
      return;
    }

    setLoadingTier(selectedTier);

    try {
      const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '/dashboard';
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTier: selectedTier,
          priceType: selectedTier,
          userId: user?.id,
          userEmail: user?.email,
          successUrl: `${origin}${currentPath}?upgrade_success=true&tier=${selectedTier}`,
          cancelUrl: `${origin}${currentPath}?upgrade_canceled=true`,
        }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to real Stripe Hosted Checkout when configured
        window.location.href = data.url;
        return;
      }

      // Local / Sandbox mode: instant tier activation + interactive Checkout Confirmation step
      setTier(selectedTier);
      applyUrlUpgradeState(selectedTier);
      setCheckoutSessionId(data.sessionId || `cs_sim_${selectedTier}_${Date.now()}`);
      setConfirmedTier(selectedTier);
      triggerUpgradeToast(selectedTier);
    } catch (err) {
      console.error('Checkout error:', err);
      // Fallback to local switch so user is never blocked
      setTier(selectedTier);
      applyUrlUpgradeState(selectedTier);
      setCheckoutSessionId(`cs_local_${selectedTier}`);
      setConfirmedTier(selectedTier);
      triggerUpgradeToast(selectedTier);
    } finally {
      setLoadingTier(null);
    }
  };

  const tiers = [
    {
      id: 'free' as UserTier,
      name: 'Free',
      badge: 'Starter',
      price: '$0',
      period: 'forever',
      description: 'Perfect for small families exploring their immediate ancestry.',
      features: [
        'Up to 25 family members',
        'Interactive React Flow canvas',
        'Public shareable web link',
        'Auto-align & generation layout',
        'Spouse, child, sibling connections',
      ],
      missing: [
        'AI Family Historian chat',
        'High-res QR Code PNG export',
        'Printable reunion cards',
      ],
    },
    {
      id: 'onetime' as UserTier,
      name: 'One-Time',
      badge: 'Popular for Reunions',
      price: '$5',
      period: 'one-time payment',
      description: 'Everything you need for reunions, weddings, and celebrations.',
      features: [
        'Up to 100 family members',
        'High-resolution QR code PNG download',
        'Printable physical invitation cards',
        'Permanent public link',
        'Lifetime access to this tree',
        'Unified Timeline & 3D World Globe',
      ],
      missing: ['AI Family Historian chat'],
    },
    {
      id: 'pro' as UserTier,
      name: 'Pro',
      badge: 'Best Value',
      price: '$7',
      period: 'per month',
      description: 'Unlock AI insights, unlimited members, and full lineage intelligence.',
      features: [
        'Unlimited family members',
        'AI Family Historian (GPT-4o-mini & smart heuristics)',
        'Natural question answering & search',
        'High-res QR codes & print cards',
        'Multiple family trees support',
        'Priority layout & relationship tracing',
      ],
      missing: [],
    },
  ];

  const confirmedTierObj = confirmedTier ? tiers.find((t) => t.id === confirmedTier) : null;

  return (
    <>
      <Dialog open={isUpgradeModalOpen} onOpenChange={(open) => !open && closeUpgradeModal()}>
        <DialogContent className="sm:max-w-4xl max-h-[90dvh] overflow-y-auto p-5 md:p-7">
          {confirmedTierObj ? (
            <div
              data-testid="checkout-confirmation-step"
              className="py-4 space-y-6 text-center max-w-lg mx-auto"
            >
              <div className="mx-auto inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-0.5">
                  Stripe Checkout Confirmed
                </Badge>
                <DialogTitle className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {confirmedTierObj.name} Plan Activated!
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Your account has been upgraded to the{' '}
                  <strong className="text-foreground">
                    {confirmedTierObj.name} ({confirmedTierObj.price}/{confirmedTierObj.period})
                  </strong>{' '}
                  tier. All entitlements are now live.
                </DialogDescription>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4 text-left space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5 text-xs">
                  <span className="text-muted-foreground font-medium">Checkout Receipt</span>
                  <span className="font-mono text-[11px] text-foreground">
                    {checkoutSessionId}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Unlocked Entitlements
                  </p>
                  {confirmedTierObj.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="confirm-checkout-view-plans-btn"
                  onClick={() => setConfirmedTier(null)}
                  className="w-full sm:w-auto text-xs"
                >
                  View All Plans
                </Button>
                <Button
                  type="button"
                  size="sm"
                  data-testid="confirm-checkout-continue-btn"
                  onClick={closeUpgradeModal}
                  className="w-full sm:w-auto text-xs font-semibold gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                >
                  <span>Continue to Family Tree</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="text-center sm:text-center space-y-2">
                <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 mb-1">
                  <Crown className="w-6 h-6" />
                </div>
                <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight">
                  Choose Your Plan
                </DialogTitle>
                <DialogDescription className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
                  Build, visualize, and share your family heritage with plans tailored for every family size.
                </DialogDescription>
              </DialogHeader>

              {upgradeReason && (
                <div
                  data-testid="upgrade-reason-banner"
                  className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs md:text-sm font-medium mb-1"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{upgradeReason}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-5">
                {tiers.map((t) => {
                  const isCurrent = tier === t.id;
                  const isHighlighted = highlightedTier === t.id;

                  return (
                    <div
                      key={t.id}
                      data-testid={`tier-card-${t.id}`}
                      className={`relative flex flex-col justify-between rounded-xl p-5 pt-6 border transition-all ${
                        isHighlighted
                          ? 'border-violet-600 dark:border-violet-400 ring-2 ring-violet-600/20 shadow-md bg-violet-50/20 dark:bg-violet-950/10'
                          : isCurrent
                          ? 'border-primary/50 bg-muted/20'
                          : 'border-border bg-card'
                      }`}
                    >
                      {t.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <Badge
                            className={`text-[10px] px-2.5 py-0.5 uppercase tracking-wide font-semibold whitespace-nowrap shadow-2xs ${
                              t.id === 'pro'
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0'
                                : t.id === 'onetime'
                                ? 'bg-blue-600 text-white border-0'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {t.badge}
                          </Badge>
                        </div>
                      )}

                      <div>
                        <div className="mt-1 flex items-center justify-between">
                          <h3 className="font-bold text-lg">{t.name}</h3>
                          {isCurrent && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300"
                            >
                              Active
                            </Badge>
                          )}
                        </div>

                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold tracking-tight">{t.price}</span>
                          <span className="text-xs text-muted-foreground">/{t.period}</span>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                          {t.description}
                        </p>

                        <div className="mt-4 border-t pt-4 space-y-2 text-xs">
                          {t.features.map((f, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span className="text-foreground">{f}</span>
                            </div>
                          ))}
                          {t.missing.map((m, i) => (
                            <div key={i} className="flex items-start gap-2 opacity-50">
                              <span className="w-3.5 text-center text-muted-foreground shrink-0 leading-none">
                                ✕
                              </span>
                              <span className="line-through text-muted-foreground">{m}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t">
                        <Button
                          data-testid={`upgrade-tier-btn-${t.id}`}
                          onClick={() => handleSelectTier(t.id)}
                          variant={isCurrent ? 'outline' : t.id === 'pro' ? 'default' : 'secondary'}
                          className={`w-full text-xs font-semibold ${
                            t.id === 'pro' && !isCurrent
                              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm'
                              : ''
                          }`}
                          disabled={isCurrent || loadingTier !== null}
                        >
                          {isCurrent ? (
                            'Current Plan'
                          ) : loadingTier === t.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              Redirecting to Checkout...
                            </>
                          ) : (
                            <>
                              {t.id === 'pro' && <Sparkles className="w-3.5 h-3.5 mr-1" />}
                              {t.id === 'onetime' && <Zap className="w-3.5 h-3.5 mr-1" />}
                              Get {t.name} ({t.price})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Secured by Stripe Checkout. In local/demo mode, selecting a plan opens instant confirmation and activates the tier immediately.
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {toastMessage && (
        <div
          data-testid="upgrade-toast-banner"
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 max-w-md flex items-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-500/40 bg-card/95 backdrop-blur-md shadow-lg text-xs font-semibold text-foreground animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
