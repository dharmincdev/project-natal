'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { parseGedcom, GedcomParseResult } from '@/lib/gedcom/parser';
import { importGedcomTree } from '@/lib/storage';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Users, Network, ArrowRight } from 'lucide-react';

interface ImportGedcomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (treeSlug: string) => void;
}

export default function ImportGedcomDialog({
  isOpen,
  onClose,
  onImportSuccess,
}: ImportGedcomDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [treeName, setTreeName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<GedcomParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.ged')) {
      setErrorMessage('Please upload a valid .ged file (standard GEDCOM format).');
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setIsParsing(true);

    try {
      const text = await selectedFile.text();
      const defaultName = selectedFile.name.replace(/\.ged$/i, '').trim();
      setTreeName(defaultName);

      const result = parseGedcom(text, { treeName: defaultName });
      setParseResult(result);
    } catch (err: any) {
      console.error('GEDCOM parse error:', err);
      setErrorMessage(err.message || 'Failed to parse GEDCOM file. Please check format.');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;

    setIsImporting(true);

    try {
      const customTreeData = {
        ...parseResult.treeData,
        tree: {
          ...parseResult.treeData.tree,
          name: treeName.trim() || parseResult.treeData.tree.name,
        },
      };

      const saved = importGedcomTree(customTreeData);

      if (onImportSuccess) {
        onImportSuccess(saved.tree.slug);
      } else {
        router.push(`/demo?tree=${saved.tree.slug}`);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving imported tree.');
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setTreeName('');
    setParseResult(null);
    setErrorMessage(null);
    setIsParsing(false);
    setIsImporting(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetState();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-xl">📁</span>
            <DialogTitle className="text-lg font-bold">Import GEDCOM File</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Import family lineage from Ancestry, MyHeritage, FamilySearch, Gramps, or any standard .ged file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Drag & Drop Area */}
          {!parseResult ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 bg-muted/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ged"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold">Click to browse or drop your .ged file here</p>
                <p className="text-xs text-muted-foreground mt-1">Supports GEDCOM 5.5.1 and 7.0 standards</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      {file?.name}
                      <Badge variant="outline" className="text-[10px] font-normal">
                        Ready to Import
                      </Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {(file?.size ? file.size / 1024 : 0).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="text-xs h-7 text-muted-foreground hover:text-foreground"
                >
                  Change File
                </Button>
              </div>

              {/* Statistics preview */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="text-lg font-black text-foreground">
                    {parseResult.stats.individualCount}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-medium">Individuals</div>
                </div>

                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="text-lg font-black text-foreground">
                    {parseResult.stats.familyCount}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-medium">Families</div>
                </div>

                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="text-lg font-black text-foreground">
                    {parseResult.stats.relationshipCount}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-medium">Connections</div>
                </div>
              </div>

              {/* Tree Name Input */}
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="tree-name" className="text-xs font-semibold">
                  Tree Name in Project Natal
                </Label>
                <Input
                  id="tree-name"
                  value={treeName}
                  onChange={(e) => setTreeName(e.target.value)}
                  placeholder="Family Tree Name"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          )}

          {isParsing && (
            <div className="text-center py-4 space-y-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">Analyzing GEDCOM records & relationships...</p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmImport}
            disabled={!parseResult || isImporting}
            className="gap-1.5 font-semibold"
          >
            {isImporting ? 'Importing...' : 'Complete Import'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
