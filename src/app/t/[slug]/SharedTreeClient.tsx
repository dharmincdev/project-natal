'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
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
import SpotlightSearch from '@/components/tree/SpotlightSearch';
import { QrCode, Copy, Check, Users, Sparkles, Lock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTier } from '@/context/TierContext';
import ThemeToggle from '@/components/shared/ThemeToggle';

const TreeOrbit3D = dynamic(() => import('@/components/tree/TreeOrbit3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium">Entering 3D Orbit...</p>
    </div>
  ),
});

const TreeWorldGlobe = dynamic(() => import('@/components/tree/TreeWorldGlobe'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium">Entering World Globe & Migration...</p>
    </div>
  ),
});

type SharedTreeClientProps = {
  initialTreeData: TreeData;
};

export default function SharedTreeClient({ initialTreeData }: SharedTreeClientProps) {
  const { tier, hasFeature, openUpgradeModal } = useTier();
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
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobilePreviewPerson(p);
    } else {
      setSelectedPerson(p);
      setIsPanelOpen(true);
    }
  }, []);

  const handleSelectSpotlightPerson = useCallback((person: Person) => {
    setHighlightedPersonId(person.id);
    handlePersonClick(person);
    setTimeout(() => {
      setHighlightedPersonId(prev => (prev === person.id ? null : prev));
    }, 6000);
  }, [handlePersonClick]);

  const memberCount = initialTreeData.people.length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-gray-50 dark:bg-gray-900">
      <header className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link href="/" className="font-bold text-base sm:text-xl text-blue-600 dark:text-blue-400 shrink-0">
            Natal
          </Link>
          <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />
          <h1 className="text-sm sm:text-lg font-semibold truncate max-w-[140px] sm:max-w-md">
            🌳 {initialTreeData.tree.name}
          </h1>
          <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shrink-0">
            <Users className="w-3 h-3" />
            {memberCount}
          </span>

          <ViewModeSwitcher currentMode={viewMode} onSelectMode={setViewMode} />

          {/* Spotlight Search Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSpotlightOpen(true)}
            className="h-8 px-2 sm:px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground bg-background shadow-2xs font-normal shrink-0"
            title="Search relatives (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1 py-0.2 rounded border bg-muted text-[10px] font-mono text-muted-foreground font-semibold">
              ⌘K
            </kbd>
          </Button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="h-8 px-2 sm:px-3 text-xs"
            title="Copy shareable link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline ml-1.5">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="h-8 px-2 sm:px-3 text-xs"
            title="Share & QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline ml-1.5">QR</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCollaboratorsOpen(true)}
            className="h-8 px-2 sm:px-3 text-xs gap-1"
            title="View tree collaborators"
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline ml-0.5">Collaborators</span>
          </Button>
          
          {hasFeature('aiChat') ? (
            <Button
              size="sm"
              onClick={() => setIsChatOpen(true)}
              className="h-8 px-2.5 sm:px-3 text-xs gap-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" /> 
              <span className="hidden xs:inline">Ask </span>AI
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openUpgradeModal('pro', 'The AI Family Historian is an exclusive Pro feature.')}
              className="h-8 px-2 sm:px-2.5 text-xs gap-1 border-violet-200 hover:border-violet-300 dark:border-violet-800 text-muted-foreground hover:text-foreground bg-violet-50/40 dark:bg-violet-950/20"
            >
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              <span>AI</span>
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 text-[9px] px-1 py-0 h-4 uppercase font-bold border-0">
                PRO
              </Badge>
            </Button>
          )}

          <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />
          
          <Link href="/demo">
            <Button size="sm" variant="secondary" className="h-8 text-xs px-2.5 sm:px-3">
              <span className="hidden sm:inline">Create Tree</span>
              <span className="sm:hidden">Demo</span>
            </Button>
          </Link>

          <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />
          <ThemeToggle />
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
        ) : viewMode === '3d' ? (
          <TreeOrbit3D
            treeData={initialTreeData}
            onPersonClick={handlePersonClick}
            selectedPersonId={highlightedPersonId || selectedPerson?.id}
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
