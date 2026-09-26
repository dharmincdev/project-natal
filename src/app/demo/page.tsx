'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { APP_CONFIG } from '@/config/app';
import { TreeData, Person, Relationship, RelationshipType, RelationshipSubtype } from '@/types/tree';
import TreeCanvas from '@/components/tree/TreeCanvas';
import PersonDetailPanel from '@/components/tree/PersonDetailPanel';
import AddPersonDialog, { NewPersonRelationshipData } from '@/components/tree/AddPersonDialog';
import AddRelationshipDialog from '@/components/tree/AddRelationshipDialog';
import QrCodeModal from '@/components/shared/QrCodeModal';
import ChatPanel from '@/components/chat/ChatPanel';
import TreeSwitcher from '@/components/tree/TreeSwitcher';
import ViewModeSwitcher, { ViewMode } from '@/components/tree/ViewModeSwitcher';
import MobilePersonPreview from '@/components/tree/MobilePersonPreview';
import TreeTimeline from '@/components/tree/TreeTimeline';
import SpotlightSearch from '@/components/tree/SpotlightSearch';
import CreateTreeDialog from '@/components/tree/CreateTreeDialog';
import ExportTreeModal from '@/components/tree/ExportTreeModal';
import ImportGedcomDialog from '@/components/tree/ImportGedcomDialog';
import { getTreeData, saveTreeData, resetStoredTree } from '@/lib/storage';
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
  Plus,
  FileSpreadsheet
} from 'lucide-react';

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

function DemoPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const treeParam = searchParams.get('tree') || 'smith-family';

  const { tier, setTier, limits, canAddPerson, hasFeature, openUpgradeModal } = useTier();
  const [currentTreeSlug, setCurrentTreeSlug] = useState<string>(treeParam);
  const [viewMode, setViewMode] = useState<ViewMode>('flat');
  const [treeData, setTreeData] = useState<TreeData>(() => getTreeData(treeParam));
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [mobilePreviewPerson, setMobilePreviewPerson] = useState<Person | null>(null);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [highlightedPersonId, setHighlightedPersonId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportGedcomOpen, setIsImportGedcomOpen] = useState(false);
  const [isCreateTreeOpen, setIsCreateTreeOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [defaultRelPersonAId, setDefaultRelPersonAId] = useState<string | undefined>();
  const [defaultRelType, setDefaultRelType] = useState<RelationshipType>('spouse');
  const [addPersonDefaults, setAddPersonDefaults] = useState<{
    relatedPersonId?: string;
    relationRole?: 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of';
  }>({});
  
  const isInitialMount = useRef(true);

  // Synchronize when treeParam in URL changes
  useEffect(() => {
    if (treeParam && treeParam !== currentTreeSlug) {
      setCurrentTreeSlug(treeParam);
      setTreeData(getTreeData(treeParam));
      setSelectedPerson(null);
      setIsPanelOpen(false);
    }
  }, [treeParam, currentTreeSlug]);

  // Auto-save whenever treeData changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveTreeData(treeData);
      setSaveStatus('saved');
      const resetStatus = setTimeout(() => setSaveStatus('idle'), 2500);
      return () => clearTimeout(resetStatus);
    }, 400);

    return () => clearTimeout(timer);
  }, [treeData]);

  const handlePersonClick = useCallback((person: Person) => {
    // On mobile touch screens, open sleek quick preview card
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobilePreviewPerson(person);
    } else {
      setSelectedPerson(person);
      setIsPanelOpen(true);
    }
  }, []);

  const handleSelectSpotlightPerson = useCallback((person: Person) => {
    setHighlightedPersonId(person.id);
    handlePersonClick(person);
    // Clear highlight ring after 6 seconds
    setTimeout(() => {
      setHighlightedPersonId(prev => (prev === person.id ? null : prev));
    }, 6000);
  }, [handlePersonClick]);

  const handleOpenAddPersonWithRelation = useCallback((
    relatedPersonId?: string,
    relationRole?: 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of'
  ) => {
    if (!canAddPerson(treeData.people.length)) {
      openUpgradeModal(
        tier === 'free' ? 'onetime' : 'pro',
        `You have reached the maximum capacity of ${limits.maxPeople} family members on the ${tier.toUpperCase()} plan. Upgrade to expand your family tree.`
      );
      return;
    }
    setAddPersonDefaults({
      relatedPersonId: relatedPersonId || selectedPerson?.id,
      relationRole: relationRole || 'child_of',
    });
    setIsAddDialogOpen(true);
  }, [canAddPerson, treeData.people.length, openUpgradeModal, tier, limits.maxPeople, selectedPerson]);

  const handleOpenAddPerson = () => {
    handleOpenAddPersonWithRelation(undefined, 'child_of');
  };

  const handleOpenAddRelationship = (personAId?: string, defaultType: RelationshipType = 'spouse') => {
    setDefaultRelPersonAId(personAId);
    setDefaultRelType(defaultType);
    setIsRelationshipDialogOpen(true);
  };

  const handleSavePerson = (updates: Partial<Person>) => {
    setTreeData(prev => {
      const updatedPeople = prev.people.map(p => 
        p.id === updates.id ? ({ ...p, ...updates } as Person) : p
      );
      return {
        ...prev,
        people: updatedPeople,
      };
    });

    if (selectedPerson && selectedPerson.id === updates.id) {
      setSelectedPerson(prev => prev ? ({ ...prev, ...updates } as Person) : null);
    }
  };

  const handleDeletePerson = (personId: string) => {
    setTreeData(prev => ({
      ...prev,
      people: prev.people.filter(p => p.id !== personId),
      relationships: prev.relationships.filter(
        r => r.personAId !== personId && r.personBId !== personId
      ),
    }));
    setIsPanelOpen(false);
    setSelectedPerson(null);
  };

  const handleCreatePerson = (
    newPersonData: any,
    relationshipData?: NewPersonRelationshipData
  ) => {
    const newPersonId = `p-${uuidv4().substring(0, 8)}`;
    const newPerson: Person = {
      ...newPersonData,
      id: newPersonId,
      treeId: treeData.tree.id,
      gender: newPersonData.gender || null,
      maidenName: newPersonData.maidenName || null,
      nickname: newPersonData.nickname || null,
      photoUrl: newPersonData.photoUrl || null,
      customFields: {},
      milestones: [],
      positionX: 0,
      positionY: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newRelationships: Relationship[] = [];

    if (relationshipData) {
      const { relatedPersonId, relationRole, subtype } = relationshipData;

      if (relationRole === 'child_of') {
        newRelationships.push({
          id: `rel-${uuidv4().substring(0, 8)}`,
          treeId: treeData.tree.id,
          personAId: relatedPersonId, // Parent
          personBId: newPersonId,      // Child
          type: 'parent_child',
          subtype,
          startDate: null,
          endDate: null,
          createdAt: new Date().toISOString(),
        });

        // ONLY link co-parent (spouse) if explicitly selected by user (allows half-siblings from other relationships!)
        if (relationshipData.alsoLinkParentIds && relationshipData.alsoLinkParentIds.length > 0) {
          relationshipData.alsoLinkParentIds.forEach(coParentId => {
            newRelationships.push({
              id: `rel-${uuidv4().substring(0, 8)}`,
              treeId: treeData.tree.id,
              personAId: coParentId,
              personBId: newPersonId,
              type: 'parent_child',
              subtype,
              startDate: null,
              endDate: null,
              createdAt: new Date().toISOString(),
            });
          });
        }
      } else if (relationRole === 'parent_of') {
        newRelationships.push({
          id: `rel-${uuidv4().substring(0, 8)}`,
          treeId: treeData.tree.id,
          personAId: newPersonId,      // Parent
          personBId: relatedPersonId,  // Child
          type: 'parent_child',
          subtype,
          startDate: null,
          endDate: null,
          createdAt: new Date().toISOString(),
        });

        // ONLY link spouse if explicitly checked by user (e.g. not a single/divorced/adoptive parent)
        if (relationshipData.alsoLinkSpouseIds && relationshipData.alsoLinkSpouseIds.length > 0) {
          relationshipData.alsoLinkSpouseIds.forEach(spouseId => {
            newRelationships.push({
              id: `rel-${uuidv4().substring(0, 8)}`,
              treeId: treeData.tree.id,
              personAId: spouseId,
              personBId: newPersonId,
              type: 'spouse',
              subtype: 'biological',
              startDate: null,
              endDate: null,
              createdAt: new Date().toISOString(),
            });
          });
        }
      } else if (relationRole === 'spouse_of') {
        newRelationships.push({
          id: `rel-${uuidv4().substring(0, 8)}`,
          treeId: treeData.tree.id,
          personAId: relatedPersonId,
          personBId: newPersonId,
          type: 'spouse',
          subtype,
          startDate: null,
          endDate: null,
          createdAt: new Date().toISOString(),
        });

        // ONLY link as co-parent if explicitly checked by user (respects step-marriages vs biological parents!)
        if (relationshipData.alsoLinkChildIds && relationshipData.alsoLinkChildIds.length > 0) {
          relationshipData.alsoLinkChildIds.forEach(childId => {
            newRelationships.push({
              id: `rel-${uuidv4().substring(0, 8)}`,
              treeId: treeData.tree.id,
              personAId: newPersonId,
              personBId: childId,
              type: 'parent_child',
              subtype: subtype === 'step' ? 'step' : 'biological',
              startDate: null,
              endDate: null,
              createdAt: new Date().toISOString(),
            });
          });
        }
      } else if (relationRole === 'sibling_of') {
        newRelationships.push({
          id: `rel-${uuidv4().substring(0, 8)}`,
          treeId: treeData.tree.id,
          personAId: relatedPersonId,
          personBId: newPersonId,
          type: 'sibling',
          subtype,
          startDate: null,
          endDate: null,
          createdAt: new Date().toISOString(),
        });

        // Link only the parents checked by the user (supports full biological, half, or step siblings!)
        if (relationshipData.alsoLinkParentIds && relationshipData.alsoLinkParentIds.length > 0) {
          relationshipData.alsoLinkParentIds.forEach(parentId => {
            newRelationships.push({
              id: `rel-${uuidv4().substring(0, 8)}`,
              treeId: treeData.tree.id,
              personAId: parentId,
              personBId: newPersonId,
              type: 'parent_child',
              subtype: subtype === 'step' ? 'step' : 'biological',
              startDate: null,
              endDate: null,
              createdAt: new Date().toISOString(),
            });
          });
        }
      }
    }

    setTreeData(prev => ({
      ...prev,
      people: [...prev.people, newPerson],
      relationships: [...prev.relationships, ...newRelationships],
    }));

    // Select the new person immediately
    setSelectedPerson(newPerson);
    setIsPanelOpen(true);
  };

  const handleAddRelationship = (relData: {
    personAId: string;
    personBId: string;
    type: RelationshipType;
    subtype: RelationshipSubtype;
  }) => {
    // Check if relationship already exists
    const exists = treeData.relationships.some(
      r => r.type === relData.type && 
        ((r.personAId === relData.personAId && r.personBId === relData.personBId) ||
         (r.type === 'spouse' && r.personAId === relData.personBId && r.personBId === relData.personAId) ||
         (r.type === 'sibling' && r.personAId === relData.personBId && r.personBId === relData.personAId))
    );

    if (exists) return;

    const newRel: Relationship = {
      id: `rel-${uuidv4().substring(0, 8)}`,
      treeId: treeData.tree.id,
      ...relData,
      startDate: null,
      endDate: null,
      createdAt: new Date().toISOString(),
    };

    setTreeData(prev => ({
      ...prev,
      relationships: [...prev.relationships, newRel],
    }));
  };

  const handleDeleteRelationship = (relId: string) => {
    setTreeData(prev => ({
      ...prev,
      relationships: prev.relationships.filter(r => r.id !== relId),
    }));
  };

  const handleSelectTree = (slug: string) => {
    setCurrentTreeSlug(slug);
    setSelectedPerson(null);
    setIsPanelOpen(false);
    const loaded = getTreeData(slug);
    setTreeData(loaded);
    router.replace(`/demo?tree=${encodeURIComponent(slug)}`, { scroll: false });
  };

  const handleResetToSample = () => {
    if (confirm(`Reset tree back to the original template? This will erase unsaved modifications for ${treeData.tree.name}.`)) {
      const restored = resetStoredTree(currentTreeSlug);
      setTreeData(restored);
      setSaveStatus('saved');
    }
  };

  const handleTreeCreated = (newTree: TreeData) => {
    setCurrentTreeSlug(newTree.tree.slug);
    setTreeData(newTree);
    setSelectedPerson(newTree.people[0] || null);
    setIsPanelOpen(true);
    router.replace(`/demo?tree=${encodeURIComponent(newTree.tree.slug)}`, { scroll: false });
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      <header className="px-2.5 sm:px-6 py-2 sm:py-3 border-b flex justify-between items-center bg-card shrink-0 gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1"
            title="Go to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline text-xs font-semibold">Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-border shrink-0 hidden sm:block" />
          
          {/* Interactive Tree Switcher */}
          <TreeSwitcher 
            currentSlug={currentTreeSlug} 
            onSelectTree={handleSelectTree}
            onOpenCreateTree={() => setIsCreateTreeOpen(true)}
            onOpenImportGedcom={() => setIsImportGedcomOpen(true)}
          />

          {/* View Mode Switcher */}
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

          <Badge variant="secondary" className="font-normal text-xs shrink-0 hidden 2xl:inline-flex">
            {treeData.people.length} Members
          </Badge>
          <Badge variant="outline" className="font-normal text-xs hidden 2xl:inline-flex shrink-0">
            {treeData.relationships.length} Connections
          </Badge>

          {/* Live Auto-Save Status Indicator */}
          {saveStatus === 'saving' && (
            <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="w-3 h-3 text-emerald-500" />
              Saved
            </span>
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
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Tier Switcher for Testing */}
          <div className="hidden 2xl:flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs mr-1">
            <button
              onClick={() => setTier('free')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                tier === 'free'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setTier('onetime')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                tier === 'onetime'
                  ? 'bg-background shadow-xs text-blue-600 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              $5 One-Time
            </button>
            <button
              onClick={() => setTier('pro')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                tier === 'pro'
                  ? 'bg-background shadow-xs text-violet-600 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pro
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToSample}
            className="text-xs h-8 text-muted-foreground hover:text-foreground hidden lg:flex"
            title="Reset tree back to factory sample data"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Demo
          </Button>

          {/* Import GEDCOM Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportGedcomOpen(true)}
            className="text-xs h-8 px-2 sm:px-3 hidden lg:inline-flex border-primary/30 text-primary hover:bg-primary/5"
            title="Import GEDCOM (.ged) file from Ancestry, MyHeritage, FamilySearch"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
            <span>Import .GED</span>
          </Button>

          {/* Export High-Res PNG / PDF / SVG Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="text-xs h-8 px-2 sm:px-3 hidden lg:inline-flex"
            title="Export full tree as high-res PNG, printable PDF, or SVG"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline ml-1">Export</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="text-xs h-8 px-2 sm:px-3 hidden lg:inline-flex"
            title="Share tree & generate QR Code"
          >
            <QrCode className="h-3.5 w-3.5 text-primary" /> 
            <span className="hidden sm:inline ml-1">Share</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenAddRelationship()}
            className="text-xs h-8 px-2 sm:px-3 hidden lg:inline-flex"
            title="Connect two relatives"
          >
            <Link2 className="h-3.5 w-3.5 text-primary" /> 
            <span className="hidden sm:inline ml-1">Connect</span>
          </Button>

          {/* + Add Person Button - Prominent, high-contrast & fully visible on mobile */}
          <Button
            size="sm"
            onClick={handleOpenAddPerson}
            className="text-xs h-8 px-2.5 sm:px-3.5 font-semibold bg-primary text-primary-foreground shadow-xs shrink-0 rounded-lg hover:opacity-90 transition-opacity"
            title="Add a new family member"
          >
            <Plus className="h-3.5 w-3.5 mr-1 sm:hidden" />
            + Add<span className="hidden xs:inline">&nbsp;Person</span>
          </Button>

          {hasFeature('aiChat') ? (
            <Button
              size="sm"
              onClick={() => setIsChatOpen(true)}
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

          {/* Mobile Action Icons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExportModalOpen(true)}
            className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            title="Export Tree"
          >
            <Download className="h-4 w-4 text-primary" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsQrModalOpen(true)}
            className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            title="Share & QR Code"
          >
            <QrCode className="h-4 w-4 text-primary" />
          </Button>

          <div className="h-4 w-px bg-border hidden sm:block" />
          <UserNav />
          <ThemeToggle />
        </div>
      </header>
      
      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'flat' ? (
          <TreeCanvas 
            treeData={treeData} 
            onPersonClick={handlePersonClick}
            onAddPerson={handleOpenAddPerson}
            onOpenAddRelationship={() => handleOpenAddRelationship()}
            onConnectRelationship={handleAddRelationship}
            isEditable={true}
            highlightedPersonId={highlightedPersonId}
          />
        ) : viewMode === '3d' ? (
          <TreeOrbit3D
            treeData={treeData}
            onPersonClick={handlePersonClick}
            selectedPersonId={highlightedPersonId || selectedPerson?.id}
          />
        ) : viewMode === 'timeline' ? (
          <TreeTimeline
            treeData={treeData}
            onPersonClick={handlePersonClick}
            highlightedPersonId={highlightedPersonId}
          />
        ) : (
          <TreeWorldGlobe
            treeData={treeData}
            onPersonClick={handlePersonClick}
            onSelectPerson={handleSelectSpotlightPerson}
            selectedPersonId={highlightedPersonId || selectedPerson?.id}
            onSwitchToFlat={() => setViewMode('flat')}
          />
        )}
      </main>

      <PersonDetailPanel 
        person={selectedPerson}
        treeData={treeData}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSave={handleSavePerson}
        onDeletePerson={handleDeletePerson}
        onOpenAddRelationship={handleOpenAddRelationship}
        onAddRelative={handleOpenAddPersonWithRelation}
        onDeleteRelationship={handleDeleteRelationship}
        onSelectPerson={handlePersonClick}
        isEditable={true}
      />

      <AddPersonDialog 
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setAddPersonDefaults({});
        }}
        onAdd={handleCreatePerson}
        existingPeople={treeData.people}
        relationships={treeData.relationships}
        defaultRelatedPersonId={addPersonDefaults.relatedPersonId ?? selectedPerson?.id}
        defaultRelationRole={addPersonDefaults.relationRole}
      />

      <AddRelationshipDialog
        isOpen={isRelationshipDialogOpen}
        onClose={() => setIsRelationshipDialogOpen(false)}
        onAddRelationship={handleAddRelationship}
        existingPeople={treeData.people}
        defaultPersonAId={defaultRelPersonAId}
        defaultType={defaultRelType}
        onSwitchToAddPerson={handleOpenAddPersonWithRelation}
      />

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        treeName={treeData.tree.name}
        slug={treeData.tree.slug}
      />

      {/* High-Resolution PNG / PDF / SVG Export Modal */}
      <ExportTreeModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        treeData={treeData}
      />

      {/* Import GEDCOM File Modal */}
      <ImportGedcomDialog
        isOpen={isImportGedcomOpen}
        onClose={() => setIsImportGedcomOpen(false)}
        onImportSuccess={(newSlug) => {
          handleSelectTree(newSlug);
        }}
      />

      {/* Start New Custom Tree Modal */}
      <CreateTreeDialog
        isOpen={isCreateTreeOpen}
        onClose={() => setIsCreateTreeOpen(false)}
        onTreeCreated={handleTreeCreated}
      />

      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        treeData={treeData}
      />

      {/* Spotlight Search & Quick-Jump Palette */}
      <SpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        onOpen={() => setIsSpotlightOpen(true)}
        treeData={treeData}
        onSelectPerson={handleSelectSpotlightPerson}
      />

      {/* Mobile Touch Quick-Preview Drawer */}
      <MobilePersonPreview
        person={mobilePreviewPerson}
        onClose={() => setMobilePreviewPerson(null)}
        onOpenFullProfile={(person) => {
          setSelectedPerson(person);
          setMobilePreviewPerson(null);
          setIsPanelOpen(true);
        }}
        onConnect={(personId) => {
          handleOpenAddRelationship(personId);
          setMobilePreviewPerson(null);
        }}
        isEditable={true}
      />
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium">Loading Family Tree...</p>
      </div>
    }>
      <DemoPageContent />
    </Suspense>
  );
}
