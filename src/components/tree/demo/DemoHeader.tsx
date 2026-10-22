'use client';

import Link from 'next/link';
import { TreeData } from '@/types/tree';
import TreeSwitcher from '@/components/tree/TreeSwitcher';
import ViewModeSwitcher, { ViewMode } from '@/components/tree/ViewModeSwitcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTier } from '@/context/TierContext';
import ThemeToggle from '@/components/shared/ThemeToggle';
import UserNav from '@/components/shared/UserNav';
import { 
  Users, 
  Link2, 
  RotateCcw, 
  ArrowLeft, 
  QrCode, 
  Sparkles, 
  Lock, 
  Crown, 
  Zap, 
  Search, 
  Download,
  Check,
  FileSpreadsheet,
  MoreHorizontal,
  ClipboardCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type DemoHeaderProps = {
  currentTreeSlug: string;
  treeData: TreeData;
  saveStatus: 'saved' | 'saving' | 'idle';
  viewMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  collaboratorCount: number;
  onSelectTree: (slug: string) => void;
  onOpenCreateTree: () => void;
  onOpenImportGedcom: () => void;
  onOpenExportModal: () => void;
  onOpenQrModal: () => void;
  onOpenCollaborators: () => void;
  onOpenAddRelationship: () => void;
  onOpenAddPerson: () => void;
  onOpenChat: () => void;
  onOpenSpotlight: () => void;
  onResetToSample: () => void;
};

export default function DemoHeader({
  currentTreeSlug,
  treeData,
  saveStatus,
  viewMode,
  onSelectMode,
  collaboratorCount,
  onSelectTree,
  onOpenCreateTree,
  onOpenImportGedcom,
  onOpenExportModal,
  onOpenQrModal,
  onOpenCollaborators,
  onOpenAddRelationship,
  onOpenAddPerson,
  onOpenChat,
  onOpenSpotlight,
  onResetToSample,
}: DemoHeaderProps) {
  const { tier, limits, hasFeature, openUpgradeModal } = useTier();

  return (
    <header className="px-2 sm:px-3 py-2 border-b flex justify-between items-center bg-card shrink-0 gap-1.5 select-none relative z-20">
      {/* Zone 1: Context & Tree Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1"
          title="Go to Dashboard"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <div className="h-4 w-px bg-border shrink-0 hidden sm:block" />
        
        {/* Interactive Tree Switcher */}
        <TreeSwitcher 
          currentSlug={currentTreeSlug} 
          onSelectTree={onSelectTree}
          onOpenCreateTree={onOpenCreateTree}
          onOpenImportGedcom={onOpenImportGedcom}
        />

        {/* Live Auto-Save Status Indicator */}
        {saveStatus === 'saving' && (
          <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium shrink-0 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Saving...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0" title="All changes saved locally">
            <Check className="w-3 h-3 text-emerald-500" />
            <span className="hidden 2xl:inline">Saved</span>
          </span>
        )}
      </div>

      {/* Zone 2: View Modes & Search */}
      <div className="flex items-center gap-1.5 shrink-0">
        <ViewModeSwitcher currentMode={viewMode} onSelectMode={onSelectMode} />

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSpotlight}
          className="h-8 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground bg-background shadow-2xs font-normal shrink-0"
          title="Search relatives (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-primary" />
          <span className="hidden 2xl:inline">Search</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.2 rounded border bg-muted text-[10px] font-mono text-muted-foreground font-semibold">
            ⌘K
          </kbd>
        </Button>
      </div>

      {/* Zone 3: Collaborations, Add Person, Ask AI, Settings */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* GEDCOM Import Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenImportGedcom}
          className="text-xs h-8 px-2 hidden lg:inline-flex border-primary/30 text-primary hover:bg-primary/5 shrink-0"
          title="Import GEDCOM (.ged) file from Ancestry, MyHeritage, FamilySearch"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
          <span>Import .GED</span>
        </Button>

        {/* Export Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenExportModal}
          className="text-xs h-8 px-2 hidden lg:inline-flex shrink-0"
          title="Export full tree as high-res PNG, printable PDF, or SVG"
        >
          <Download className="h-3.5 w-3.5 text-primary mr-1" />
          <span>Export</span>
        </Button>

        {/* Share Button (2xl screens; also available in More Actions menu) */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenQrModal}
          className="text-xs h-8 px-2 hidden 2xl:inline-flex shrink-0"
          title="Share tree & generate QR Code"
        >
          <QrCode className="h-3.5 w-3.5 text-primary mr-1" />
          <span>Share</span>
        </Button>

        {/* Collaborate Button */}
        <Button
          variant="outline"
          size="sm"
          aria-label="Collaborate"
          onClick={onOpenCollaborators}
          className="text-xs h-8 px-2 hidden lg:inline-flex gap-1 shrink-0"
          title="Collaborate with relatives"
        >
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="hidden 2xl:inline">Collaborate</span>
          {collaboratorCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 min-w-4 flex items-center justify-center font-bold ml-0.5">
              {collaboratorCount}
            </Badge>
          )}
        </Button>

        {/* More Actions Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer" title="More Actions">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onOpenAddRelationship} className="cursor-pointer">
              <Link2 className="h-4 w-4 mr-2 text-primary" />
              <span>Connect Relatives</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenQrModal} className="cursor-pointer">
              <QrCode className="h-4 w-4 mr-2 text-primary" />
              <span>Share & QR Code</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenCollaborators} className="cursor-pointer lg:hidden">
              <Users className="h-4 w-4 mr-2 text-primary" />
              <span>Collaborators</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenExportModal} className="cursor-pointer lg:hidden">
              <Download className="h-4 w-4 mr-2 text-primary" />
              <span>Export Tree</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenImportGedcom} className="cursor-pointer lg:hidden">
              <FileSpreadsheet className="h-4 w-4 mr-2 text-primary" />
              <span>Import GEDCOM</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openUpgradeModal()} className="cursor-pointer">
              {tier === 'pro' && <Crown className="h-4 w-4 mr-2 text-violet-600" />}
              {tier === 'onetime' && <Zap className="h-4 w-4 mr-2 text-blue-600" />}
              {tier === 'free' && <Crown className="h-4 w-4 mr-2 text-muted-foreground" />}
              <div className="flex flex-col">
                <span className="capitalize font-medium text-xs">{tier} Plan</span>
                <span className="text-[10px] text-muted-foreground">
                  {treeData.people.length} / {limits.maxPeople === Infinity ? 'Unlimited' : limits.maxPeople} relatives
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open('/qa', '_blank')} className="cursor-pointer flex items-center justify-between">
              <div className="flex items-center">
                <ClipboardCheck className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                <span>QA Testing Plan</span>
              </div>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                50 Tests
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onResetToSample} className="cursor-pointer text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-4 w-4 mr-2" />
              <span>Reset to Sample Data</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* + Add Person Button */}
        <Button
          size="sm"
          onClick={onOpenAddPerson}
          className="text-xs h-8 px-2.5 sm:px-3 font-semibold bg-primary text-primary-foreground shadow-xs shrink-0 rounded-lg hover:opacity-90 transition-opacity"
          title="Add a new family member"
        >
          <span>+ Add Person</span>
        </Button>

        {/* Ask AI Button */}
        {hasFeature('aiChat') ? (
          <Button
            size="sm"
            onClick={onOpenChat}
            className="text-xs h-8 px-2 sm:px-3 font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-xs gap-1 shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" /> 
            <span className="hidden sm:inline">Ask </span>AI
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openUpgradeModal('pro', 'The AI Family Historian is an exclusive Pro feature.')}
            className="text-xs h-8 px-1.5 sm:px-2.5 font-medium border-violet-200 hover:border-violet-300 dark:border-violet-800 text-muted-foreground hover:text-foreground gap-1 bg-violet-50/40 dark:bg-violet-950/20 shrink-0"
            title="Unlock AI Family Historian with Pro"
          >
            <Lock className="h-3.5 w-3.5 text-amber-500" />
            <span>AI</span>
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 text-[9px] px-1 py-0 h-4 uppercase font-bold border-0">
              PRO
            </Badge>
          </Button>
        )}

        {/* Tier Indicator Badge */}
        <Badge
          variant="outline"
          onClick={() => openUpgradeModal(tier === 'free' ? 'pro' : undefined)}
          className={`cursor-pointer text-xs font-semibold px-2 py-0.5 transition-colors gap-1 hidden 2xl:inline-flex shrink-0 ${
            tier === 'pro'
              ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300'
              : tier === 'onetime'
              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
              : 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
          }`}
          title="Click to view plans and upgrade"
        >
          {tier === 'pro' && <Crown className="w-3 h-3 text-violet-600" />}
          {tier === 'onetime' && <Zap className="w-3 h-3 text-blue-600" />}
          <span className="capitalize">{tier}</span>
          <span className="text-[10px] opacity-75 font-normal">
            ({treeData.people.length}/{limits.maxPeople === Infinity ? '∞' : limits.maxPeople})
          </span>
        </Badge>

        <div className="h-4 w-px bg-border hidden sm:block shrink-0" />
        <UserNav />
        <ThemeToggle />
      </div>
    </header>
  );
}
