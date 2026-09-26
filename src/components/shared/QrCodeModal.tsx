'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTier } from '@/context/TierContext';
import { QrCode, Copy, Check, Download, Share2, Printer, Lock, Zap, Smartphone, Globe, Wifi } from 'lucide-react';

type QrCodeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  treeName: string;
  slug: string;
};

export default function QrCodeModal({
  isOpen,
  onClose,
  treeName,
  slug,
}: QrCodeModalProps) {
  const { tier, hasFeature, openUpgradeModal } = useTier();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [networkIp, setNetworkIp] = useState<string>('192.168.68.63');
  const [shareMode, setShareMode] = useState<'mobile' | 'web'>('mobile');

  const canExport = hasFeature('qrCode');
  const canPrint = hasFeature('print');

  const isLocalHost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Fetch local LAN IP from server API
  useEffect(() => {
    if (isOpen) {
      fetch('/api/network-ip')
        .then(res => res.json())
        .then(data => {
          if (data.ip && data.ip !== 'localhost') {
            setNetworkIp(data.ip);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const port = typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : ':3000';
  const mobileUrl = `http://${networkIp}${port}/t/${slug}`;
  const webUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/t/${slug}`
    : `https://natal.app/t/${slug}`;

  const activeUrl = isLocalHost && shareMode === 'mobile' ? mobileUrl : webUrl;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(activeUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code', err));
    }
  }, [isOpen, activeUrl]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (copied) {
      timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    if (!canExport) {
      openUpgradeModal('onetime', 'High-res QR Code PNG export is included with the One-Time ($5) and Pro plans.');
      return;
    }
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${slug}-family-tree-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (!canPrint) {
      openUpgradeModal('onetime', 'Printable family tree reunion cards are included with the One-Time ($5) and Pro plans.');
      return;
    }
    const printWindow = window.open('', '', 'width=600,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${treeName}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            h1 { font-size: 24px; color: #0f172a; margin-bottom: 8px; }
            p { font-size: 16px; color: #475569; margin-bottom: 24px; }
            img { max-width: 320px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
          </style>
        </head>
        <body>
          <h1>${treeName} Family Tree</h1>
          <p>Scan to view family tree</p>
          <img src="${qrDataUrl}" alt="Family Tree QR Code" />
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 100);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Share Family Tree
          </DialogTitle>
          <DialogDescription>
            Anyone with this link or QR code can view and explore the family tree on their phone or computer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4 py-3">
          {/* Mode Switcher for local development */}
          {isLocalHost && (
            <div className="w-full flex items-center p-1 rounded-lg bg-muted text-xs font-medium">
              <button
                type="button"
                onClick={() => setShareMode('mobile')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                  shareMode === 'mobile'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                <span>Phone Camera (Wi-Fi)</span>
              </button>
              <button
                type="button"
                onClick={() => setShareMode('web')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                  shareMode === 'web'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Web / Localhost</span>
              </button>
            </div>
          )}

          <div className="flex flex-col items-center justify-center p-4 border rounded-xl shadow-sm bg-white dark:bg-card">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Family Tree QR Code"
                className="w-48 h-48 sm:w-60 sm:h-60 object-contain rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center bg-slate-50 animate-pulse rounded-lg">
                <QrCode className="w-12 h-12 text-slate-300" />
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-primary" />
              {shareMode === 'mobile' ? 'Scan to open on smartphone' : 'Scan with phone camera'}
            </p>
          </div>

          {/* Wi-Fi mobile hint */}
          {isLocalHost && shareMode === 'mobile' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 w-full">
              <Wifi className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Make sure your phone is connected to the <strong>same Wi-Fi</strong> network.
              </span>
            </div>
          )}

          {/* iOS Safari HTTPS-Only Troubleshooting Tip */}
          {isLocalHost && shareMode === 'mobile' && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 w-full leading-relaxed">
              <span className="text-sm shrink-0">💡</span>
              <div>
                <p className="font-semibold text-amber-950 dark:text-amber-100">
                  iPhone Safari says "HTTPS-Only enabled"?
                </p>
                <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                  On your iPhone, go to <strong>Settings ➔ Safari ➔ Advanced</strong> and toggle off <strong>"HTTPS-Only Mode"</strong> (or open the link in Chrome).
                </p>
              </div>
            </div>
          )}

          <div className="w-full space-y-1.5">
            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value={activeUrl}
                className="flex-1 bg-muted/40 font-mono text-xs"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleCopy}
                className="shrink-0 h-9 w-9"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
          </div>

          {!canExport && (
            <div 
              onClick={() => openUpgradeModal('onetime', 'High-res QR Code PNG downloads and printable reunion cards are included with the One-Time ($5) and Pro plans.')}
              className="w-full p-2.5 rounded-lg border border-blue-100 bg-blue-50/60 dark:bg-blue-950/20 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between cursor-pointer hover:bg-blue-100/60 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                Unlock high-res PNG & printable cards
              </span>
              <Badge variant="outline" className="bg-white/80 dark:bg-gray-800 text-[10px] font-semibold border-blue-200">
                $5 Plan
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between sm:space-x-2 gap-2">
          <div className="flex space-x-2 w-full sm:w-auto">
            <Button
              type="button"
              variant={canExport ? "outline" : "ghost"}
              onClick={handleDownload}
              className={`flex-1 sm:flex-none ${!canExport ? "text-muted-foreground border border-dashed" : ""}`}
              disabled={!qrDataUrl}
            >
              {!canExport ? (
                <Lock className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              PNG
            </Button>
            <Button
              type="button"
              variant={canPrint ? "outline" : "ghost"}
              onClick={handlePrint}
              className={`flex-1 sm:flex-none ${!canPrint ? "text-muted-foreground border border-dashed" : ""}`}
              disabled={!qrDataUrl}
            >
              {!canPrint ? (
                <Lock className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              Print
            </Button>
          </div>
          <Button type="button" onClick={onClose} className="w-full sm:w-auto">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
