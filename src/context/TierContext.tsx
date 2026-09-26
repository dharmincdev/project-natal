'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserTier, TIER_LIMITS, TierConfig } from '@/types/tree';

export type TierContextType = {
  tier: UserTier;
  setTier: (tier: UserTier) => void;
  limits: TierConfig;
  isUpgradeModalOpen: boolean;
  highlightedTier: UserTier | null;
  upgradeReason: string | null;
  openUpgradeModal: (targetTier?: UserTier, reason?: string) => void;
  closeUpgradeModal: () => void;
  canAddPerson: (currentPeopleCount: number) => boolean;
  hasFeature: (feature: 'aiChat' | 'qrCode' | 'print') => boolean;
};

const TierContext = createContext<TierContextType | undefined>(undefined);

export function TierProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTierState] = useState<UserTier>('free');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [highlightedTier, setHighlightedTier] = useState<UserTier | null>(null);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedTier = localStorage.getItem('project_natal_user_tier') as UserTier | null;
      if (savedTier && (savedTier === 'free' || savedTier === 'onetime' || savedTier === 'pro')) {
        setTierState(savedTier);
      }
    } catch {
      // Ignore localStorage errors in restricted environments
    }
  }, []);

  const setTier = (newTier: UserTier) => {
    setTierState(newTier);
    try {
      localStorage.setItem('project_natal_user_tier', newTier);
    } catch {
      // Ignore
    }
  };

  const openUpgradeModal = (targetTier: UserTier = 'pro', reason?: string) => {
    setHighlightedTier(targetTier);
    setUpgradeReason(reason || null);
    setIsUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
    setHighlightedTier(null);
    setUpgradeReason(null);
  };

  const limits = TIER_LIMITS[tier];

  const canAddPerson = (currentPeopleCount: number) => {
    return currentPeopleCount < limits.maxPeople;
  };

  const hasFeature = (feature: 'aiChat' | 'qrCode' | 'print') => {
    if (feature === 'aiChat') return limits.hasAiChat;
    if (feature === 'qrCode') return limits.hasQrCode;
    if (feature === 'print') return limits.hasPrint;
    return false;
  };

  return (
    <TierContext.Provider
      value={{
        tier,
        setTier,
        limits,
        isUpgradeModalOpen,
        highlightedTier,
        upgradeReason,
        openUpgradeModal,
        closeUpgradeModal,
        canAddPerson,
        hasFeature,
      }}
    >
      {children}
    </TierContext.Provider>
  );
}

export function useTier(): TierContextType {
  const context = useContext(TierContext);
  if (!context) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
}
