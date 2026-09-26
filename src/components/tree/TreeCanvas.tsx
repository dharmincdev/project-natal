'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  Node, 
  Edge,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  ReactFlowInstance,
  StraightEdge,
  SmoothStepEdge,
  StepEdge,
  BezierEdge,
} from '@xyflow/react';
import '@/styles/xyflow.css';
import { TreeData, Person, RelationshipType, RelationshipSubtype } from '@/types/tree';
import PersonNode from './PersonNode';
import UnionNode from './UnionNode';
import ChannelEdge from './ChannelEdge';
import RelationshipLegend from './RelationshipLegend';
import LandscapeHelper from './LandscapeHelper';
import { Button } from '@/components/ui/button';
import { Plus, Link2, RotateCcw, ZoomIn } from 'lucide-react';
import { layoutFamilyTree } from '@/lib/layout';
import { useTheme } from '@/context/ThemeContext';

const nodeTypes = {
  person: PersonNode,
  union: UnionNode,
};

const edgeTypes = {
  channel: ChannelEdge,
  bezier: BezierEdge,
  default: BezierEdge,
  straight: StraightEdge,
  smoothstep: SmoothStepEdge,
  step: StepEdge,
};

type TreeCanvasProps = {
  treeData: TreeData;
  onPersonClick: (person: Person) => void;
  onAddPerson: () => void;
  onOpenAddRelationship?: () => void;
  onConnectRelationship?: (rel: {
    personAId: string;
    personBId: string;
    type: RelationshipType;
    subtype: RelationshipSubtype;
  }) => void;
  highlightedPersonId?: string | null;
  isEditable: boolean;
};

export default function TreeCanvas({ 
  treeData, 
  onPersonClick, 
  onAddPerson, 
  onOpenAddRelationship,
  onConnectRelationship,
  highlightedPersonId,
  isEditable 
}: TreeCanvasProps) {
  const { resolvedTheme } = useTheme();
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<any, any> | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Keep stable reference to onPersonClick so layout useMemo does not re-run on every parent re-render
  const onPersonClickRef = useRef(onPersonClick);
  useEffect(() => {
    onPersonClickRef.current = onPersonClick;
  }, [onPersonClick]);

  const handleNodeClick = useCallback((person: Person) => {
    onPersonClickRef.current?.(person);
  }, []);

  // Detect desktop display dimensions for MiniMap and desktop aids
  useEffect(() => {
    function checkScreenDimensions() {
      if (typeof window !== 'undefined') {
        setShowMiniMap(window.innerWidth >= 1024 && window.innerHeight >= 650);
      }
    }
    checkScreenDimensions();
    window.addEventListener('resize', checkScreenDimensions);
    window.addEventListener('orientationchange', checkScreenDimensions);
    return () => {
      window.removeEventListener('resize', checkScreenDimensions);
      window.removeEventListener('orientationchange', checkScreenDimensions);
    };
  }, []);

  // Compute layout whenever people, relationships, or custom positions change
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes: rawNodes, edges: rawEdges } = layoutFamilyTree(
      treeData.people, 
      treeData.relationships,
      customPositions
    );

    const nodesWithCallbacks = rawNodes.map(node => {
      if (node.type === 'union') {
        return node;
      }
      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted: node.id === highlightedPersonId,
          onClick: handleNodeClick,
        },
      };
    });

    return { initialNodes: nodesWithCallbacks, initialEdges: rawEdges };
  }, [treeData.people, treeData.relationships, customPositions, highlightedPersonId, handleNodeClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when initial calculation changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Center tree whenever active tree changes or layout resets
  useEffect(() => {
    if (rfInstance) {
      const timer = setTimeout(() => {
        try {
          rfInstance.fitView({ padding: 0.25, minZoom: 0.2, maxZoom: 1.2, duration: 400 });
        } catch {
          // Ignore
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [rfInstance, treeData.tree.id]);

  // Re-fit view smoothly when rotating device or resizing window
  useEffect(() => {
    function handleOrientationOrResize() {
      if (rfInstance) {
        rfInstance.fitView({ padding: 0.25, duration: 300 });
      }
    }
    window.addEventListener('resize', handleOrientationOrResize);
    window.addEventListener('orientationchange', handleOrientationOrResize);
    return () => {
      window.removeEventListener('resize', handleOrientationOrResize);
      window.removeEventListener('orientationchange', handleOrientationOrResize);
    };
  }, [rfInstance]);

  // Smoothly center onto highlighted person when selected via Spotlight Search
  useEffect(() => {
    if (highlightedPersonId && rfInstance) {
      const targetNode = nodes.find(n => n.id === highlightedPersonId);
      if (targetNode) {
        const centerX = targetNode.position.x + 128;
        const centerY = targetNode.position.y + 45;
        rfInstance.setCenter(centerX, centerY, { zoom: 1.2, duration: 600 });
      }
    }
  }, [highlightedPersonId, rfInstance, nodes]);

  // Handle node drag end to remember position
  const onNodeDragStop = useCallback((_: any, node: Node) => {
    if (node.type === 'union') return;
    setCustomPositions(prev => ({
      ...prev,
      [node.id]: { x: node.position.x, y: node.position.y },
    }));
  }, []);

  // Handle connecting handles directly on canvas
  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    let relType: RelationshipType = 'parent_child';
    if (
      connection.sourceHandle === 'spouse-source' || 
      connection.targetHandle === 'spouse-target'
    ) {
      relType = 'spouse';
    }

    if (onConnectRelationship) {
      onConnectRelationship({
        personAId: connection.source,
        personBId: connection.target,
        type: relType,
        subtype: 'biological',
      });
    }
  }, [onConnectRelationship]);

  const handleResetLayout = () => {
    setCustomPositions({});
    setTimeout(() => {
      rfInstance?.fitView({ padding: 0.25, duration: 400 });
    }, 100);
  };

  return (
    <div className="w-full h-full relative bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={isEditable ? handleConnect : undefined}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={{ x: 300, y: 120, zoom: 0.8 }}
        onInit={(instance) => {
          setRfInstance(instance);
          setTimeout(() => {
            try {
              instance.fitView({ padding: 0.25, minZoom: 0.2, maxZoom: 1.2 });
            } catch {
              // Ignore
            }
          }, 250);
        }}
        fitView
        fitViewOptions={{ padding: 0.25, minZoom: 0.2, maxZoom: 1.2 }}
        minZoom={0.15}
        maxZoom={1.8}
        nodesDraggable={isEditable}
        nodesConnectable={isEditable}
        preventScrolling={true}
        zoomOnPinch={true}
        panOnDrag={true}
      >
        <Background 
          gap={20} 
          size={1} 
          color={resolvedTheme === 'dark' ? '#334155' : '#cbd5e1'} 
        />
        <Controls 
          showInteractive={false} 
          className="!left-3 !bottom-3 sm:!left-4 sm:!bottom-4 rounded-lg overflow-hidden shadow-md border bg-card border-border"
        />
        {showMiniMap && (
          <MiniMap 
            zoomable 
            pannable 
            nodeStrokeWidth={3}
            className="!w-[200px] !h-[140px] !bottom-4 !left-4 border rounded-lg shadow-sm overflow-hidden bg-card border-border"
          />
        )}
      </ReactFlow>

      {/* Navigation aid hint pill - Desktop only */}
      {showHint && showMiniMap && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background/90 text-muted-foreground border border-border shadow-md backdrop-blur-xs text-xs select-none">
          <span>💡 Scroll to zoom • Drag to pan • Hover nodes for details</span>
          <button 
            onClick={() => setShowHint(false)} 
            className="hover:text-foreground ml-1 text-xs opacity-70 hover:opacity-100 transition-opacity"
            title="Dismiss hint"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Toolbar */}
      {isEditable && (
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 lg:top-4 lg:right-4 z-10 flex items-center gap-1.5 sm:gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetLayout}
            className="h-8 sm:h-9 px-2 sm:px-2.5 lg:px-3 gap-1 sm:gap-1.5 shadow-md bg-background hover:bg-muted text-xs font-medium"
            title="Reset to clean automatic tree layout"
          >
            <RotateCcw className="h-3.5 w-3.5" /> 
            <span className="hidden lg:inline">Auto-Align</span>
          </Button>

          {onOpenAddRelationship && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenAddRelationship}
              className="h-8 sm:h-9 px-2 sm:px-2.5 lg:px-3 gap-1 sm:gap-1.5 shadow-md bg-background hover:bg-muted text-xs font-medium text-foreground"
              title="Add a connection between family members"
            >
              <Link2 className="h-3.5 w-3.5 text-primary" /> 
              <span className="hidden lg:inline">Connect</span>
            </Button>
          )}

          <Button 
            onClick={onAddPerson} 
            size="sm" 
            className="hidden lg:inline-flex h-9 px-3.5 gap-1.5 shadow-md font-medium text-xs rounded-lg"
          >
            <Plus className="h-4 w-4" /> 
            <span>Add Person</span>
          </Button>
        </div>
      )}

      {/* Floating Relationship Line Legend */}
      <RelationshipLegend />

      {/* Mobile Landscape Orientation Guide */}
      <LandscapeHelper onReorient={() => rfInstance?.fitView({ padding: 0.25, duration: 400 })} />
    </div>
  );
}
