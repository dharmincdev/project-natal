'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { TreeData, Person } from '@/types/tree';
import TreeCanvas from '@/components/tree/TreeCanvas';
import PersonDetailPanel from '@/components/tree/PersonDetailPanel';
import QrCodeModal from '@/components/shared/QrCodeModal';
import ChatPanel from '@/components/chat/ChatPanel';
import CollaboratorsModal from '@/components/tree/CollaboratorsModal';
import MobilePersonPreview from '@/components/tree/MobilePersonPreview';
import ViewModeSwitcher, { ViewMode } from '@/components/tree/ViewModeSwitcher';
import TreeTimeline from '@/components/tree/TreeTimeline';
import TreeWorldGlobe from '@/components/tree/TreeWorldGlobe';
import SpotlightSearch from '@/components/tree/SpotlightSearch';
import { QrCode, Copy, Check, Users, Sparkles, Lock, Search, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useTier } from '@/context/TierContext';
import ThemeToggle from '@/components/shared/ThemeToggle';
import UserNav from '@/components/shared/UserNav';

type SharedTreeClientProps = {
  initialTreeData: TreeData;
};

export default function SharedTreeClient({ initialTreeData }: SharedTreeClientProps) {
  const { hasFeature, openUpgradeModal } = useTier();
  const [viewMode, setViewMode] = useState<ViewMode>('flat');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [mobilePreviewPerson, setMobilePreviewPerson] = useState<Person | null>(null);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [highlightedPersonId, setHighlightedPersonId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePersonClick = useCallback((p: Person) => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setMobilePreviewPerson(p);
    } else {
      setSelectedPerson(p);
      setIsPanelOpen(true);
    }
  }, []);

  const handleSelectSpotlightPerson = useCallback(
    (person: Person) => {
      setHighlightedPersonId(person.id);
      handlePersonClick(person);
      setTimeout(() => {
        setHighlightedPersonId((prev) => (prev === person.id ? null : prev));
      }, 6000);
    },
    [handlePersonClick]
  );

  const memberCount = initialTreeData.people.length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-testid="shared-tree-shell"
      className="flex flex-col h-[100dvh] overflow-hidden bg-background text-foreground"
    >
      <header className="flex-none min-h-14 bg-card/95 backdrop-blur-md border-b border-border px-2 sm:px-5 py-2 flex items-center justify-between z-30 gap-1.5 sm:gap-3 shrink-0">
        {/* Zone 1: Brand & Tree Identity */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
          <Link
            href="/"
            className="font-bold text-sm sm:text-lg text-primary shrink-0 tracking-tight"
          >
            Natal
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block shrink-0" />
          <h1 className="text-xs sm:text-base font-semibold text-foreground truncate max-w-[95px] sm:max-w-xs">
            🌳 {initialTreeData.tree.name}
          </h1>
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Users className="w-3 h-3" />
            {memberCount}
          </span>
        </div>

        {/* Zone 2: View Modes & Search */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <ViewModeSwitcher currentMode={viewMode} onSelectMode={setViewMode} />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSpotlightOpen(true)}
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

        {/* Zone 3: Share, Collaborators, AI & Theme */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="hidden sm:inline-flex h-8 px-2.5 text-xs"
            title="Copy shareable link"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline ml-1.5">{copied ? 'Copied' : 'Copy'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="hidden sm:inline-flex h-8 px-2.5 text-xs"
            title="Share & QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline ml-1.5">QR</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCollaboratorsOpen(true)}
            className="hidden sm:inline-flex h-8 px-2.5 text-xs gap-1"
            title="View tree collaborators"
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="hidden lg:inline ml-0.5">Collaborators</span>
          </Button>

          {/* Mobile <640px overflow menu */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                title="More Actions"
                aria-label="More Actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                  <Copy className="h-4 w-4 mr-2 text-primary" />
                  <span>{copied ? 'Copied Link!' : 'Copy Share Link'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsQrModalOpen(true)} className="cursor-pointer">
                  <QrCode className="h-4 w-4 mr-2 text-primary" />
                  <span>Share & QR Code</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsCollaboratorsOpen(true)}
                  className="cursor-pointer"
                >
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  <span>Collaborators</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {hasFeature('aiChat') ? (
            <Button
              type="button"
              size="sm"
              data-testid="header-ask-ai-btn"
              onClick={() => setIsChatOpen(true)}
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs gap-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
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
              className="h-7 sm:h-8 px-1.5 sm:px-2.5 text-xs gap-1 border-violet-200 hover:border-violet-300 dark:border-violet-800 text-muted-foreground hover:text-foreground bg-violet-50/40 dark:bg-violet-950/20"
            >
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              <span>AI</span>
              <Badge className="hidden sm:inline-flex bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 text-[9px] px-1 py-0 h-4 uppercase font-bold border-0">
                PRO
              </Badge>
            </Button>
          )}

          <div className="h-4 w-px bg-border hidden sm:block" />

          <Link href="/demo" className="hidden sm:block">
            <Button size="sm" variant="secondary" className="h-8 text-xs px-2.5 sm:px-3">
              <span className="hidden md:inline">Create Tree</span>
              <span className="md:hidden">Demo</span>
            </Button>
          </Link>

          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5">
            <UserNav />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'flat' ? (
          <TreeCanvas
            treeData={initialTreeData}
            onPersonClick={handlePersonClick}
            isEditable={false}
            onAddPerson={() => {}}
            highlightedPersonId={highlightedPersonId}
          />
        ) : viewMode === 'timeline' ? (
          <TreeTimeline
            treeData={initialTreeData}
            onPersonClick={handlePersonClick}
            highlightedPersonId={highlightedPersonId}
          />
        ) : (
          <TreeWorldGlobe
            treeData={initialTreeData}
            onPersonClick={handlePersonClick}
            onSelectPerson={handleSelectSpotlightPerson}
            selectedPersonId={highlightedPersonId || selectedPerson?.id}
            onSwitchToFlat={() => setViewMode('flat')}
          />
        )}
      </main>

      <PersonDetailPanel
        person={selectedPerson}
        treeData={initialTreeData}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSave={() => {}}
        isEditable={false}
      />

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        treeName={initialTreeData.tree.name}
        slug={initialTreeData.tree.slug}
      />

      <CollaboratorsModal
        isOpen={isCollaboratorsOpen}
        onClose={() => setIsCollaboratorsOpen(false)}
        tree={initialTreeData.tree}
      />

      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        treeData={initialTreeData}
      />

      {/* Spotlight Search & Quick-Jump Palette */}
      <SpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        onOpen={() => setIsSpotlightOpen(true)}
        treeData={initialTreeData}
        onSelectPerson={handleSelectSpotlightPerson}
      />

      {/* Mobile Touch Quick-Preview Drawer (replaces hover card on touch devices) */}
      <MobilePersonPreview
        person={mobilePreviewPerson}
        onClose={() => setMobilePreviewPerson(null)}
        onOpenFullProfile={(person) => {
          setSelectedPerson(person);
          setMobilePreviewPerson(null);
          setIsPanelOpen(true);
        }}
        isEditable={false}
      />
    </div>
  );
}
