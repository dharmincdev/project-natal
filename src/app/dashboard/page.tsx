'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_CONFIG } from '@/config/app';
import { getAllTreeSummaries, deleteStoredTree, getTreeData, TreeSummary, createNewUserTree } from '@/lib/storage';
import { TreeData } from '@/types/tree';
import CreateTreeDialog from '@/components/tree/CreateTreeDialog';
import QrCodeModal from '@/components/shared/QrCodeModal';
import ExportTreeModal from '@/components/tree/ExportTreeModal';
import CollaboratorsModal from '@/components/tree/CollaboratorsModal';
import ThemeToggle from '@/components/shared/ThemeToggle';
import UserNav from '@/components/shared/UserNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  TreePine, 
  ExternalLink, 
  Trash2, 
  Share2, 
  Download, 
  Sparkles, 
  Users, 
  UserPlus,
  Calendar, 
  ArrowRight,
  Search,
  Network
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [trees, setTrees] = useState<TreeSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Modals for share, export, & collaborate
  const [activeModalTree, setActiveModalTree] = useState<TreeData | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);

  const refreshTrees = () => {
    setTrees(getAllTreeSummaries());
  };

  useEffect(() => {
    refreshTrees();
  }, []);

  const handleTreeCreated = (newTree: TreeData) => {
    refreshTrees();
    router.push(`/demo?tree=${newTree.tree.slug}`);
  };

  const handleDelete = (tree: TreeSummary) => {
    if (!confirm(`Are you sure you want to delete "${tree.name}"? This action cannot be undone.`)) {
      return;
    }
    deleteStoredTree(tree.id);
    refreshTrees();
  };

  const handleOpenShare = (tree: TreeSummary) => {
    const data = getTreeData(tree.slug);
    setActiveModalTree(data);
    setIsQrOpen(true);
  };

  const handleOpenExport = (tree: TreeSummary) => {
    const data = getTreeData(tree.slug);
    setActiveModalTree(data);
    setIsExportOpen(true);
  };

  const handleOpenCollaborate = (tree: TreeSummary) => {
    const data = getTreeData(tree.slug);
    setActiveModalTree(data);
    setIsCollaboratorsOpen(true);
  };

  const customTrees = trees.filter(
    (t) => t.isCustom && (t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sampleTrees = trees.filter(
    (t) => !t.isCustom && (t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="px-4 sm:px-8 py-3.5 border-b flex justify-between items-center bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🌳</span>
            <span className="font-bold text-lg tracking-tight">{APP_CONFIG.name}</span>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:inline">
            Dashboard
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/demo">
            <Button variant="ghost" size="sm" className="text-xs">
              Interactive Canvas
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Tree</span>
          </Button>
          <UserNav />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Family Trees</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create, organize, and explore your family lineages with intelligent layout and AI insights.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search trees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 pr-3 text-xs rounded-lg border border-input bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-44 sm:w-56"
              />
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="h-9 text-xs font-semibold gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Start New Tree</span>
            </Button>
          </div>
        </div>

        {/* My Custom Trees Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TreePine className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base sm:text-lg">My Family Trees</h2>
              <Badge variant="secondary" className="text-xs">
                {customTrees.length}
              </Badge>
            </div>
          </div>

          {customTrees.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-border bg-card/40 text-center flex flex-col items-center justify-center max-w-2xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl">
                🏡
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base sm:text-lg">No custom family trees yet</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                  Start mapping your own ancestry! Begin with yourself or an ancestor, and connect parents, spouses, and children.
                </p>
              </div>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 font-semibold text-xs h-9">
                <Plus className="w-3.5 h-3.5" />
                <span>Create My First Tree</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {customTrees.map((tree) => (
                <Card
                  key={tree.id}
                  className="rounded-xl border hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between overflow-hidden bg-card"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 rounded-lg bg-muted/60">{tree.emoji}</span>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base leading-snug">{tree.name}</h3>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 mt-1 bg-background font-medium">
                            {tree.tag}
                          </Badge>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tree)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete Tree"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {tree.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {tree.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground border-t flex-wrap">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-primary/70" />
                        <span className="font-semibold text-foreground">{tree.memberCount}</span> members
                      </div>
                      <div className="flex items-center gap-1">
                        <Network className="w-3.5 h-3.5 text-primary/70" />
                        <span className="font-semibold text-foreground">{tree.connectionCount}</span> connections
                      </div>
                      {tree.collaboratorCount > 0 && (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{tree.collaboratorCount} contributors</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <div className="px-5 py-3 bg-muted/30 border-t flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenShare(tree)}
                        className="h-7 px-2 text-[11px] gap-1"
                        title="Share link & QR code"
                      >
                        <Share2 className="w-3 h-3 text-primary" />
                        <span>Share</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCollaborate(tree)}
                        className="h-7 px-2 text-[11px] gap-1"
                        title="Manage tree collaborators"
                      >
                        <Users className="w-3 h-3 text-primary" />
                        <span>Collaborate</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenExport(tree)}
                        className="h-7 px-2 text-[11px] gap-1"
                        title="Export PNG or PDF"
                      >
                        <Download className="w-3 h-3 text-primary" />
                        <span>Export</span>
                      </Button>
                    </div>

                    <Link href={`/demo?tree=${tree.slug}`}>
                      <Button size="sm" className="h-7 px-2.5 text-[11px] gap-1 font-semibold">
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sample Templates Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-base sm:text-lg">Sample Templates & Dynasties</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {sampleTrees.map((tree) => (
              <Card
                key={tree.id}
                className="rounded-xl border hover:border-primary/40 transition-all hover:shadow-md flex flex-col justify-between overflow-hidden bg-card"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-lg bg-muted/60">{tree.emoji}</span>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base leading-snug">{tree.name}</h3>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 mt-1 font-medium">
                        {tree.tag}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {tree.description}
                  </p>

                  <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground border-t flex-wrap">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary/70" />
                      <span className="font-semibold text-foreground">{tree.memberCount}</span> members
                    </div>
                    <div className="flex items-center gap-1">
                      <Network className="w-3.5 h-3.5 text-primary/70" />
                      <span className="font-semibold text-foreground">{tree.connectionCount}</span> connections
                    </div>
                    {tree.collaboratorCount > 0 && (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{tree.collaboratorCount} contributors</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <div className="px-5 py-3 bg-muted/30 border-t flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenShare(tree)}
                      className="h-7 px-2 text-[11px] gap-1"
                      title="Share link & QR code"
                    >
                      <Share2 className="w-3 h-3 text-primary" />
                      <span>Share</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCollaborate(tree)}
                      className="h-7 px-2 text-[11px] gap-1"
                      title="Manage tree collaborators"
                    >
                      <Users className="w-3 h-3 text-primary" />
                      <span>Collaborate</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenExport(tree)}
                      className="h-7 px-2 text-[11px] gap-1"
                      title="Export PNG or PDF"
                    >
                      <Download className="w-3 h-3 text-primary" />
                      <span>Export</span>
                    </Button>
                  </div>

                  <Link href={`/demo?tree=${tree.slug}`}>
                    <Button size="sm" variant="secondary" className="h-7 px-2.5 text-[11px] gap-1 font-semibold">
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Create Tree Dialog */}
      <CreateTreeDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTreeCreated={handleTreeCreated}
      />

      {/* Share / QR Modal */}
      {activeModalTree && (
        <QrCodeModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          treeName={activeModalTree.tree.name}
          slug={activeModalTree.tree.slug}
        />
      )}

      {/* Export Canvas Modal */}
      {activeModalTree && (
        <ExportTreeModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          treeData={activeModalTree}
        />
      )}

      {/* Collaborators Modal */}
      {activeModalTree && (
        <CollaboratorsModal
          isOpen={isCollaboratorsOpen}
          onClose={() => setIsCollaboratorsOpen(false)}
          tree={activeModalTree.tree}
          onCollaboratorChange={refreshTrees}
        />
      )}
    </div>
  );
}
