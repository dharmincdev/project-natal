'use client';

import React, { useState } from 'react';
import { TreeData } from '@/types/tree';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Download, Printer, Image, FileCode, Check, FileSpreadsheet } from 'lucide-react';
import {
  downloadTreePng,
  downloadTreeSvg,
  downloadTreeGedcom,
  printTreePoster,
} from '@/lib/tree-export';

type ExportTreeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  treeData: TreeData;
};

export default function ExportTreeModal({
  isOpen,
  onClose,
  treeData,
}: ExportTreeModalProps) {
  const [resolution, setResolution] = useState<'standard' | 'high' | 'ultra'>('high');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadPng = async () => {
    setIsExporting(true);
    try {
      await downloadTreePng(treeData, { resolution, themeMode, includeHeader });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSvg = () => {
    downloadTreeSvg(treeData, { themeMode, includeHeader });
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleDownloadGedcom = () => {
    downloadTreeGedcom(treeData);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrintPoster = () => {
    printTreePoster(treeData, { themeMode, includeHeader });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold">
              Export Family Tree
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Download your full family tree diagram in high resolution for framing, printing, or archiving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tree Info Summary */}
          <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">{treeData.tree.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {treeData.people.length} Members • {treeData.relationships.length} Connections
              </p>
            </div>
            <Badge variant="outline" className="text-xs bg-background">
              All Generations
            </Badge>
          </div>

          {/* Resolution Options */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Image Resolution (DPI)</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setResolution('standard')}
                className={`p-2.5 rounded-lg border text-center transition-all text-xs ${
                  resolution === 'standard'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <div>Standard (1x)</div>
                <div className="text-[10px] opacity-75">Web & Mobile</div>
              </button>
              <button
                type="button"
                onClick={() => setResolution('high')}
                className={`p-2.5 rounded-lg border text-center transition-all text-xs ${
                  resolution === 'high'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <div>High (2x)</div>
                <div className="text-[10px] opacity-75">Print & Frame</div>
              </button>
              <button
                type="button"
                onClick={() => setResolution('ultra')}
                className={`p-2.5 rounded-lg border text-center transition-all text-xs ${
                  resolution === 'ultra'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <div>Ultra (3x)</div>
                <div className="text-[10px] opacity-75">Poster Size</div>
              </button>
            </div>
          </div>

          {/* Style & Theme Option */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Color Style</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    themeMode === 'light'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    themeMode === 'dark'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Title Banner</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setIncludeHeader(true)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    includeHeader
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Include
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeHeader(false)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    !includeHeader
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Diagram Only
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="pt-2 space-y-2">
            <Button
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="w-full h-10 gap-2 bg-primary text-primary-foreground font-semibold shadow-xs"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Image className="w-4 h-4" />
                  <span>Download High-Res PNG ({resolution.toUpperCase()})</span>
                </>
              )}
            </Button>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPoster}
                className="h-9 gap-1.5 text-xs font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF / Print</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSvg}
                className="h-9 gap-1.5 text-xs font-medium"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>SVG Vector</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadGedcom}
                className="h-9 gap-1.5 text-xs font-medium text-primary hover:text-primary hover:bg-primary/5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>GEDCOM 7.0</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
