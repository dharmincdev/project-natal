'use client';

import { TreeData, Person, RelationshipType, RelationshipSubtype } from '@/types/tree';
import PersonDetailPanel from '@/components/tree/PersonDetailPanel';
import AddPersonDialog, { NewPersonRelationshipData } from '@/components/tree/AddPersonDialog';
import AddRelationshipDialog from '@/components/tree/AddRelationshipDialog';
import QrCodeModal from '@/components/shared/QrCodeModal';
import ExportTreeModal from '@/components/tree/ExportTreeModal';
import ImportGedcomDialog from '@/components/tree/ImportGedcomDialog';
import CreateTreeDialog from '@/components/tree/CreateTreeDialog';
import CollaboratorsModal from '@/components/tree/CollaboratorsModal';
import ChatPanel from '@/components/chat/ChatPanel';
import SpotlightSearch from '@/components/tree/SpotlightSearch';
import MobilePersonPreview from '@/components/tree/MobilePersonPreview';

type DemoModalsProps = {
  treeData: TreeData;
  selectedPerson: Person | null;
  setSelectedPerson: (person: Person | null) => void;
  mobilePreviewPerson: Person | null;
  setMobilePreviewPerson: (person: Person | null) => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  addPersonDefaults: {
    relatedPersonId?: string;
    relationRole?: 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of';
  };
  setAddPersonDefaults: (defaults: {
    relatedPersonId?: string;
    relationRole?: 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of';
  }) => void;
  isRelationshipDialogOpen: boolean;
  setIsRelationshipDialogOpen: (open: boolean) => void;
  defaultRelPersonAId?: string;
  defaultRelType: RelationshipType;
  isQrModalOpen: boolean;
  setIsQrModalOpen: (open: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  isImportGedcomOpen: boolean;
  setIsImportGedcomOpen: (open: boolean) => void;
  isCollaboratorsOpen: boolean;
  setIsCollaboratorsOpen: (open: boolean) => void;
  onCollaboratorChange: () => void;
  isCreateTreeOpen: boolean;
  setIsCreateTreeOpen: (open: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isSpotlightOpen: boolean;
  setIsSpotlightOpen: (open: boolean) => void;
  handlePersonClick: (person: Person) => void;
  handleSelectSpotlightPerson: (person: Person) => void;
  handleSavePerson: (updates: Partial<Person>) => void;
  handleDeletePerson: (personId: string) => void;
  handleOpenAddRelationship: (personAId?: string, defaultType?: RelationshipType) => void;
  handleOpenAddPersonWithRelation: (
    relatedPersonId?: string,
    relationRole?: 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of'
  ) => void;
  handleDeleteRelationship: (relId: string) => void;
  handleCreatePerson: (
    newPersonData: Partial<Person> & { firstName: string; lastName?: string },
    relationshipData?: NewPersonRelationshipData
  ) => void;
  handleAddRelationship: (relData: {
    personAId: string;
    personBId: string;
    type: RelationshipType;
    subtype: RelationshipSubtype;
  }) => void;
  handleSelectTree: (slug: string) => void;
  handleTreeCreated: (newTree: TreeData) => void;
};

export default function DemoModals({
  treeData,
  selectedPerson,
  setSelectedPerson,
  mobilePreviewPerson,
  setMobilePreviewPerson,
  isPanelOpen,
  setIsPanelOpen,
  isAddDialogOpen,
  setIsAddDialogOpen,
  addPersonDefaults,
  setAddPersonDefaults,
  isRelationshipDialogOpen,
  setIsRelationshipDialogOpen,
  defaultRelPersonAId,
  defaultRelType,
  isQrModalOpen,
  setIsQrModalOpen,
  isExportModalOpen,
  setIsExportModalOpen,
  isImportGedcomOpen,
  setIsImportGedcomOpen,
  isCollaboratorsOpen,
  setIsCollaboratorsOpen,
  onCollaboratorChange,
  isCreateTreeOpen,
  setIsCreateTreeOpen,
  isChatOpen,
  setIsChatOpen,
  isSpotlightOpen,
  setIsSpotlightOpen,
  handlePersonClick,
  handleSelectSpotlightPerson,
  handleSavePerson,
  handleDeletePerson,
  handleOpenAddRelationship,
  handleOpenAddPersonWithRelation,
  handleDeleteRelationship,
  handleCreatePerson,
  handleAddRelationship,
  handleSelectTree,
  handleTreeCreated,
}: DemoModalsProps) {
  return (
    <>
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
        existingRelationships={treeData.relationships}
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

      {/* Tree Collaborators & Permissions Modal */}
      <CollaboratorsModal
        isOpen={isCollaboratorsOpen}
        onClose={() => setIsCollaboratorsOpen(false)}
        tree={treeData.tree}
        onCollaboratorChange={onCollaboratorChange}
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
    </>
  );
}
