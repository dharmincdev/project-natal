'use client';

import Link from 'next/link';
import { TreeData } from '@/types/tree';
import TreeSwitcher from '@/components/tree/TreeSwitcher';
import ViewModeSwitcher, { ViewMode } from '@/components/tree/ViewModeSwitcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTier } from '@/context/TierContext';
import { useAuth } from '@/context/AuthContext';
import { PresencePeer } from '@/lib/supabase/realtime';
import ThemeToggle from '@/components/shared/ThemeToggle';
import UserNav from '@/components/shared/UserNav';
import { QA_TEST_CASES } from '@/data/qa-test-cases';
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
  Cloud,
  RefreshCw,
  Radio,
  FileSpreadsheet,
  MoreHorizontal,
  ClipboardCheck,
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
  activePeers?: PresencePeer[];
  isRealtimeConnected?: boolean;
  onManualSync?: () => void;
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
  activePeers = [],
  isRealtimeConnected = true,
  onManualSync,
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
  const { user, isConfigured } = useAuth();
  const memberCount = treeData.people.length;
  const isAtCapacity = limits.maxPeople !== Infinity && memberCount >= limits.maxPeople;

  return (
    <header
      data-testid="demo-header"
      className="min-h-14 px-2 sm:px-3.5 py-2 border-b border-border flex justify-between items-center bg-card/95 backdrop-blur-md shrink-0 gap-1.5 sm:gap-2 select-none relative z-30"
    >
      {/* Zone 1: Context & Tree Switcher + Inspectable Cloud Sync Status Badge */}
      <div data-testid="header-zone-1" className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
        <Link
          href="/dashboard"
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1 rounded-md hover:bg-muted/60"
          title="Go to Dashboard"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Dashboard</span>
        </Link>
        <div className="h-4 w-px bg-border shrink-0 hidden sm:block" />

        {/* Interactive Tree Switcher */}
        <TreeSwitcher
          currentSlug={currentTreeSlug}
          onSelectTree={onSelectTree}
          onOpenCreateTree={onOpenCreateTree}
          onOpenImportGedcom={onOpenImportGedcom}
        />

        {/* Inspectable Cloud Sync & Realtime Presence Popover Badge (PRO-22, PRO-30) */}
        <DropdownMenu>
          <DropdownMenuTrigger
            data-testid="cloud-sync-badge"
            className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border/80 bg-muted/40 hover:bg-muted text-[11px] font-medium transition-colors cursor-pointer shrink-0"
            title="Inspect Cloud Sync & Realtime Collaboration Status"
          >
            {saveStatus === 'saving' ? (
              <>
                <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                <span className="text-amber-600 dark:text-amber-400">Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
              </>
            ) : user ? (
              <>
                <Cloud className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Cloud Synced</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-muted-foreground">Synced</span>
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-72 p-3 space-y-2.5"
            data-testid="cloud-sync-inspector"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold">Persistence & Cloud Sync</span>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                {saveStatus === 'saving' ? 'Syncing' : 'Active'}
              </Badge>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Storage Engine:</span>
                <span className="font-semibold text-foreground">
                  {user
                    ? isConfigured
                      ? 'Supabase PostgreSQL + RLS'
                      : 'Cloud Sandbox + Local Cache'
                    : 'Offline-First LocalStorage'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Realtime Channel:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Radio className="w-3 h-3" />
                  {isRealtimeConnected ? `Live (${Math.max(1, activePeers.length)} online)` : 'Standby'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Relatives Synced:</span>
                <span className="font-mono font-semibold">{memberCount} nodes</span>
              </div>
            </div>

            {onManualSync && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onManualSync}
                className="w-full h-7 text-[11px] gap-1.5 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync Tree Now</span>
              </Button>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Zone 2: View Modes & Search */}
      <div data-testid="header-zone-2" className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <ViewModeSwitcher currentMode={viewMode} onSelectMode={onSelectMode} />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenSpotlight}
          className="h-7 w-7 sm:h-8 sm:w-auto px-0 sm:px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground bg-background shadow-2xs font-normal shrink-0"
          title="Search relatives (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1 py-0.2 rounded border bg-muted text-[10px] font-mono text-muted-foreground font-semibold">
            ⌘K
          </kbd>
        </Button>
      </div>

      {/* Zone 3: Collaborations, Add Person, Ask AI, Capacity Badge, Auth & Theme */}
      <div data-testid="header-zone-3" className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* GEDCOM Import Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenImportGedcom}
          className="text-xs h-8 px-2.5 hidden lg:inline-flex border-primary/30 text-primary hover:bg-primary/5 shrink-0"
          title="Import GEDCOM (.ged) file from Ancestry, MyHeritage, FamilySearch"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 mr-1 shrink-0" />
          <span>Import .GED</span>
        </Button>

        {/* Export Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenExportModal}
          className="text-xs h-8 px-2.5 hidden lg:inline-flex shrink-0"
          title="Export full tree as high-res PNG, printable PDF, or SVG"
        >
          <Download className="h-3.5 w-3.5 text-primary mr-1 shrink-0" />
          <span>Export</span>
        </Button>

        {/* Collaborate Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Collaborate"
          onClick={onOpenCollaborators}
          className="text-xs h-8 px-2.5 hidden lg:inline-flex items-center gap-1.5 shrink-0"
          title="Collaborate with relatives"
        >
          <Users className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Collaborate</span>
          {collaboratorCount > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-bold"
            >
              {collaboratorCount}
            </Badge>
          )}
        </Button>

        {/* More Actions Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-lg border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
            title="More Actions"
            aria-label="More Actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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
              <span>Collaborators ({collaboratorCount})</span>
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
            <DropdownMenuItem
              onClick={() => openUpgradeModal()}
              className="cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center">
                {tier === 'pro' && <Crown className="h-4 w-4 mr-2 text-violet-600" />}
                {tier === 'onetime' && <Zap className="h-4 w-4 mr-2 text-blue-600" />}
                {tier === 'free' && <Crown className="h-4 w-4 mr-2 text-muted-foreground" />}
                <div className="flex flex-col">
                  <span className="capitalize font-medium text-xs">{tier} Plan</span>
                  <span className="text-[10px] text-muted-foreground">
                    {memberCount} / {limits.maxPeople === Infinity ? 'Unlimited' : limits.maxPeople}{' '}
                    relatives
                  </span>
                </div>
              </div>
              {isAtCapacity && (
                <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40">
                  Full
                </Badge>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.open('/qa', '_blank')}
              className="cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center">
                <ClipboardCheck className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                <span>QA Testing Plan</span>
              </div>
              <Badge
                variant="secondary"
                className="text-[9px] px-1.5 py-0 h-4 font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              >
                {QA_TEST_CASES.length} Tests
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onResetToSample}
              className="cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              <span>Reset to Sample Data</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* + Add Person Button */}
        <Button
          type="button"
          size="sm"
          onClick={onOpenAddPerson}
          className="text-xs h-7 sm:h-8 px-2 sm:px-3 font-semibold bg-primary text-primary-foreground shadow-xs shrink-0 rounded-lg hover:opacity-90 transition-opacity"
          title="Add a new family member"
        >
          <span>+ Add</span>
          <span className="hidden sm:inline">&nbsp;Person</span>
        </Button>

        {/* Ask AI Button (PRO-25) */}
        {hasFeature('aiChat') ? (
          <Button
            type="button"
            size="sm"
            data-testid="header-ask-ai-btn"
            onClick={onOpenChat}
            className="text-xs h-7 sm:h-8 px-2 sm:px-3 font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-xs gap-1 shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300 shrink-0" />
            <span className="hidden sm:inline">Ask </span>
            <span>AI</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="header-ai-locked-btn"
            onClick={() =>
              openUpgradeModal('pro', 'The AI Family Historian is an exclusive Pro feature.')
            }
            className="text-xs h-7 sm:h-8 px-1.5 sm:px-2.5 font-medium border-violet-200 hover:border-violet-300 dark:border-violet-800 text-muted-foreground hover:text-foreground gap-1 bg-violet-50/40 dark:bg-violet-950/20 shrink-0"
            title="Unlock AI Family Historian with Pro"
          >
            <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>AI</span>
            <Badge className="hidden xs:inline-flex bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 text-[9px] px-1 py-0 h-4 uppercase font-bold border-0">
              PRO
            </Badge>
          </Button>
        )}

        {/* Tier & Capacity Indicator Badge (PRO-11) */}
        <Badge
          data-testid="capacity-badge"
          variant="outline"
          onClick={() => openUpgradeModal(tier === 'free' ? 'onetime' : 'pro')}
          className={`cursor-pointer text-xs font-semibold px-2.5 py-1 h-8 rounded-lg transition-colors items-center gap-1.5 hidden lg:inline-flex shrink-0 ${
            isAtCapacity
              ? 'bg-amber-500/15 text-amber-800 border-amber-500/40 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700'
              : tier === 'pro'
              ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300'
              : tier === 'onetime'
              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
              : 'bg-muted/70 text-foreground border-border'
          }`}
          title="Click to view plans and member capacity"
        >
          {tier === 'pro' && <Crown className="w-3.5 h-3.5 text-violet-600 shrink-0" />}
          {tier === 'onetime' && <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
          <span className="capitalize">{tier}</span>
          <span className="text-[11px] opacity-85 font-mono">
            {memberCount}/{limits.maxPeople === Infinity ? '∞' : limits.maxPeople}
          </span>
        </Badge>

        <div className="h-4 w-px bg-border hidden sm:block shrink-0" />
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <UserNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
