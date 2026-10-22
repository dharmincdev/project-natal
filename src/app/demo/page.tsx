'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams, useRouter } from 'next/navigation';
import { TreeData, Person, Relationship, RelationshipType, RelationshipSubtype } from '@/types/tree';
import TreeCanvas from '@/components/tree/TreeCanvas';
import { ViewMode } from '@/components/tree/ViewModeSwitcher';
import TreeTimeline from '@/components/tree/TreeTimeline';
import DemoHeader from '@/components/tree/demo/DemoHeader';
import DemoModals from '@/components/tree/demo/DemoModals';
import { NewPersonRelationshipData } from '@/components/tree/AddPersonDialog';
import { getTreeData, saveTreeData, resetStoredTree, getStoredCollaborators } from '@/lib/storage';
import { validateRelationship } from '@/lib/tree-utils';
import { useTier } from '@/context/TierContext';
import { AlertCircle, X } from 'lucide-react';

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

  const { tier, limits, canAddPerson, openUpgradeModal } = useTier();
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
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [collaboratorCount, setCollaboratorCount] = useState<number>(() => getStoredCollaborators(treeParam).length);
  const [isCreateTreeOpen, setIsCreateTreeOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [defaultRelPersonAId, setDefaultRelPersonAId] = useState<string | undefined>();
  const [defaultRelType, setDefaultRelType] = useState<RelationshipType>('spouse');
  const [addPersonDefaults, setAddPersonDefaults] = useState<{
    relatedPersonId?: string;
    relationRole?: 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of';
  }>({});
  const [graphAlert, setGraphAlert] = useState<string | null>(null);
  
  const isInitialMount = useRef(true);

  // Synchronize when treeParam in URL changes
  useEffect(() => {
    if (treeParam && treeParam !== currentTreeSlug) {
      setCurrentTreeSlug(treeParam);
      setTreeData(getTreeData(treeParam));
      setCollaboratorCount(getStoredCollaborators(treeParam).length);
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
    newPersonData: Partial<Person> & { firstName: string; lastName?: string },
    relationshipData?: NewPersonRelationshipData
  ) => {
    const newPersonId = `p-${uuidv4().substring(0, 8)}`;
    const newPerson: Person = {
      id: newPersonId,
      treeId: treeData.tree.id,
      firstName: newPersonData.firstName,
      lastName: newPersonData.lastName || '',
      maidenName: newPersonData.maidenName || null,
      nickname: newPersonData.nickname || null,
      gender: newPersonData.gender || null,
      birthDate: newPersonData.birthDate || null,
      deathDate: newPersonData.deathDate || null,
      birthPlace: newPersonData.birthPlace || null,
      photoUrl: newPersonData.photoUrl || null,
      bio: newPersonData.bio || null,
      customFields: newPersonData.customFields || {},
      milestones: newPersonData.milestones || [],
      attachments: newPersonData.attachments || [],
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
          personAId: relatedPersonId,
          personBId: newPersonId,
          type: 'parent_child',
          subtype: subtype || 'biological',
          startDate: null,
          endDate: null,
          createdAt: new Date().toISOString(),
        });

        if (relationshipData.alsoLinkParentIds && relationshipData.alsoLinkParentIds.length > 0) {
          relationshipData.alsoLinkParentIds.forEach(parentId => {
            newRelationships.push({
              id: `rel-${uuidv4().substring(0, 8)}`,
              treeId: treeData.tree.id,
              personAId: parentId,
              personBId: newPersonId,
              type: 'parent_child',
              subtype: 'biological',
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
          personAId: newPersonId,
          personBId: relatedPersonId,
          type: 'parent_child',
          subtype: subtype || 'biological',
          startDate: null,
          endDate: null,
          createdAt: new Date().toISOString(),
        });

        if (relationshipData.alsoLinkSpouseIds && relationshipData.alsoLinkSpouseIds.length > 0) {
          relationshipData.alsoLinkSpouseIds.forEach(spouseId => {
            newRelationships.push({
              id: `rel-${uuidv4().substring(0, 8)}`,
              treeId: treeData.tree.id,
              personAId: newPersonId,
              personBId: spouseId,
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
          subtype: subtype || 'biological',
          startDate: null,
          endDate: null,
          createdAt: new Date().toISOString(),
        });

        if (relationshipData.alsoLinkChildIds && relationshipData.alsoLinkChildIds.length > 0) {
          relationshipData.alsoLinkChildIds.forEach(childId => {
            newRelationships.push({
              id: `rel-${uuidv4().substring(0, 8)}`,
              treeId: treeData.tree.id,
              personAId: newPersonId,
              personBId: childId,
              type: 'parent_child',
              subtype: 'biological',
              startDate: null,
              endDate: null,
              createdAt: new Date().toISOString(),
            });
          });
        }
      } else if (relationRole === 'sibling_of') {
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
    const validation = validateRelationship(relData, treeData.relationships);
    if (!validation.isValid) {
      setGraphAlert(validation.error);
      return;
    }
    setGraphAlert(null);

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
      <DemoHeader
        currentTreeSlug={currentTreeSlug}
        treeData={treeData}
        saveStatus={saveStatus}
        viewMode={viewMode}
        onSelectMode={setViewMode}
        collaboratorCount={collaboratorCount}
        onSelectTree={handleSelectTree}
        onOpenCreateTree={() => setIsCreateTreeOpen(true)}
        onOpenImportGedcom={() => setIsImportGedcomOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenCollaborators={() => setIsCollaboratorsOpen(true)}
        onOpenAddRelationship={() => handleOpenAddRelationship()}
        onOpenAddPerson={handleOpenAddPerson}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenSpotlight={() => setIsSpotlightOpen(true)}
        onResetToSample={handleResetToSample}
      />
      
      <main className="flex-1 relative overflow-hidden">
        {graphAlert && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-destructive/40 bg-destructive/15 text-destructive backdrop-blur-md shadow-lg text-xs font-semibold">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <span>{graphAlert}</span>
              </div>
              <button
                onClick={() => setGraphAlert(null)}
                className="p-1 hover:bg-destructive/20 rounded-md transition-colors"
                aria-label="Dismiss error"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {viewMode === 'flat' ? (
          <TreeCanvas 
            treeData={treeData} 
            onPersonClick={handlePersonClick}
            onAddPerson={handleOpenAddPerson}
            onOpenAddRelationship={() => handleOpenAddRelationship()}
            onConnectRelationship={handleAddRelationship}
            onRelationshipError={setGraphAlert}
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

      <DemoModals
        treeData={treeData}
        selectedPerson={selectedPerson}
        setSelectedPerson={setSelectedPerson}
        mobilePreviewPerson={mobilePreviewPerson}
        setMobilePreviewPerson={setMobilePreviewPerson}
        isPanelOpen={isPanelOpen}
        setIsPanelOpen={setIsPanelOpen}
        isAddDialogOpen={isAddDialogOpen}
        setIsAddDialogOpen={setIsAddDialogOpen}
        addPersonDefaults={addPersonDefaults}
        setAddPersonDefaults={setAddPersonDefaults}
        isRelationshipDialogOpen={isRelationshipDialogOpen}
        setIsRelationshipDialogOpen={setIsRelationshipDialogOpen}
        defaultRelPersonAId={defaultRelPersonAId}
        defaultRelType={defaultRelType}
        isQrModalOpen={isQrModalOpen}
        setIsQrModalOpen={setIsQrModalOpen}
        isExportModalOpen={isExportModalOpen}
        setIsExportModalOpen={setIsExportModalOpen}
        isImportGedcomOpen={isImportGedcomOpen}
        setIsImportGedcomOpen={setIsImportGedcomOpen}
        isCollaboratorsOpen={isCollaboratorsOpen}
        setIsCollaboratorsOpen={setIsCollaboratorsOpen}
        onCollaboratorChange={() => {
          setCollaboratorCount(getStoredCollaborators(currentTreeSlug).length);
        }}
        isCreateTreeOpen={isCreateTreeOpen}
        setIsCreateTreeOpen={setIsCreateTreeOpen}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        isSpotlightOpen={isSpotlightOpen}
        setIsSpotlightOpen={setIsSpotlightOpen}
        handlePersonClick={handlePersonClick}
        handleSelectSpotlightPerson={handleSelectSpotlightPerson}
        handleSavePerson={handleSavePerson}
        handleDeletePerson={handleDeletePerson}
        handleOpenAddRelationship={handleOpenAddRelationship}
        handleOpenAddPersonWithRelation={handleOpenAddPersonWithRelation}
        handleDeleteRelationship={handleDeleteRelationship}
        handleCreatePerson={handleCreatePerson}
        handleAddRelationship={handleAddRelationship}
        handleSelectTree={handleSelectTree}
        handleTreeCreated={handleTreeCreated}
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
