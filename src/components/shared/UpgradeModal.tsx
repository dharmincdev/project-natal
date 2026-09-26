'use client';

import React from 'react';
import { useTier } from '@/context/TierContext';
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
import { Check, Sparkles, Zap, Crown, AlertCircle } from 'lucide-react';

export default function UpgradeModal() {
  const {
    tier,
    setTier,
    isUpgradeModalOpen,
    closeUpgradeModal,
    highlightedTier,
    upgradeReason,
  } = useTier();

  const handleSelectTier = (selectedTier: UserTier) => {
    setTier(selectedTier);
    closeUpgradeModal();
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
        'Timeline & alternative views (coming soon)',
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

  return (
    <Dialog open={isUpgradeModalOpen} onOpenChange={(open) => !open && closeUpgradeModal()}>
      <DialogContent className="max-w-4xl p-6 md:p-8">
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
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs md:text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{upgradeReason}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {tiers.map((t) => {
            const isCurrent = tier === t.id;
            const isHighlighted = highlightedTier === t.id;

            return (
              <div
                key={t.id}
                className={`relative flex flex-col justify-between rounded-xl p-5 border transition-all ${
                  isHighlighted
                    ? 'border-violet-600 dark:border-violet-400 ring-2 ring-violet-600/20 shadow-md bg-violet-50/20 dark:bg-violet-950/10'
                    : isCurrent
                    ? 'border-primary/50 bg-muted/20'
                    : 'border-border bg-card'
                }`}
              >
                {t.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge
                      className={`text-[10px] px-2.5 py-0.5 uppercase tracking-wide font-semibold ${
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
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300">
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
                        <span className="w-3.5 text-center text-muted-foreground shrink-0 leading-none">✕</span>
                        <span className="line-through text-muted-foreground">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <Button
                    onClick={() => handleSelectTier(t.id)}
                    variant={isCurrent ? 'outline' : t.id === 'pro' ? 'default' : 'secondary'}
                    className={`w-full text-xs font-semibold ${
                      t.id === 'pro' && !isCurrent
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm'
                        : ''
                    }`}
                    disabled={isCurrent}
                  >
                    {isCurrent ? (
                      'Current Plan'
                    ) : (
                      <>
                        {t.id === 'pro' && <Sparkles className="w-3.5 h-3.5 mr-1" />}
                        {t.id === 'onetime' && <Zap className="w-3.5 h-3.5 mr-1" />}
                        Switch to {t.name} (Demo)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-xs text-muted-foreground pt-2">
          Payments are deferred during MVP testing. Clicking any plan immediately updates your active tier for live feature testing.
        </div>
      </DialogContent>
    </Dialog>
  );
}
