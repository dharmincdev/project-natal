'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, Check, X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type LandscapeHelperProps = {
  onReorient?: () => void;
};

export default function LandscapeHelper({ onReorient }: LandscapeHelperProps) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasDismissedPill, setHasDismissedPill] = useState(false);

  useEffect(() => {
    function checkOrientation() {
      if (typeof window !== 'undefined') {
        const portrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
        setIsPortrait(portrait);
        onReorient?.();
      }
    }

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [onReorient]);

  const handleRequestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if ('screen' in window && 'orientation' in window.screen && 'lock' in (window.screen.orientation as any)) {
        await (window.screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch {
      // Fullscreen/lock might not be supported on iOS Safari, which is expected
    }
    setIsModalOpen(false);
  };

  // Only show the floating prompt pill on mobile portrait when not dismissed
  if (!isPortrait || hasDismissedPill) return null;

  return (
    <>
      {/* Floating Landscape Suggestion Pill */}
      <div className="sm:hidden absolute top-3 left-3 z-20 animate-in fade-in-0 duration-300">
        <div className="flex items-center gap-1.5 p-1 pl-2.5 pr-1.5 rounded-full bg-background/95 border border-primary/30 shadow-lg text-xs font-semibold backdrop-blur-md text-foreground">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors text-[11px]"
            title="Learn how to view in landscape"
          >
            <RotateCw className="w-3.5 h-3.5 text-primary animate-spin-slow" />
            <span>Rotate for Widescreen</span>
          </button>
          <button
            onClick={() => setHasDismissedPill(true)}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors ml-0.5"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Instructional Landscape Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md w-[92vw] rounded-2xl p-5">
          <DialogHeader className="text-center sm:text-left">
            <DialogTitle className="flex items-center justify-center sm:justify-start gap-2 text-base font-bold">
              <RotateCw className="w-5 h-5 text-primary" />
              Turn Phone to Landscape
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Family trees are wide! Rotating your phone sideways unlocks a panoramic view with double the horizontal width.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col items-center justify-center space-y-3">
            {/* Visual Phone Rotating Graphic */}
            <div className="relative flex items-center justify-center w-28 h-28 rounded-2xl bg-muted/50 border border-border">
              <div className="relative flex items-center justify-center">
                <Smartphone className="w-14 h-14 text-muted-foreground transition-transform duration-700 hover:rotate-90" />
                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                  <RotateCw className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="space-y-2 text-center text-xs w-full">
              <p className="font-semibold text-foreground">
                How to enable landscape:
              </p>
              <div className="bg-muted/40 rounded-xl p-3 text-left space-y-1.5 text-[11px] text-muted-foreground">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Turn your phone sideways (horizontally).</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>
                    If it doesn't rotate, turn off <strong>Portrait Orientation Lock</strong> in your iPhone Control Center (swipe down from top-right).
                  </span>
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestFullscreen}
              className="flex-1 h-9 text-xs gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                setHasDismissedPill(true);
              }}
              className="flex-1 h-9 text-xs font-semibold gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Got It</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
