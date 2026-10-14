import React, { useMemo, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge
} from '@xyflow/react';
import { LayoutDashboard, Maximize2, Minimize2, Sparkles, AlertCircle, Compass } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { UserTurnNode } from './nodes/UserTurnNode';
import { AssistantTurnNode } from './nodes/AssistantTurnNode';
import { GhostNode } from './nodes/GhostNode';
import { LineageEdge } from './edges/LineageEdge';
import { InsightEdge } from './edges/InsightEdge';
import { InsightComparisonDrawer } from './panels/InsightComparisonDrawer';

const nodeTypes = {
  userTurn: UserTurnNode,
  assistantTurn: AssistantTurnNode,
  ghostNode: GhostNode,
};

const edgeTypes = {
  lineage: LineageEdge,
  insight: InsightEdge,
};

const CanvasInner: React.FC = () => {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const activeNodeId = useWorkspaceStore((state) => state.activeNodeId);
  const activeLineage = useWorkspaceStore((state) => state.activeLineage);
  const recalculateAutoLayout = useWorkspaceStore((state) => state.recalculateAutoLayout);
  const isCanvasFullscreen = useWorkspaceStore((state) => state.isCanvasFullscreen);
  const toggleCanvasFullscreen = useWorkspaceStore((state) => state.toggleCanvasFullscreen);

  const { setCenter, fitView } = useReactFlow();

  const currentWorkspace = workspaces[activeWorkspaceId];
  const activeLineageIds = useMemo(
    () => new Set(activeLineage.map((n) => n.id)),
    [activeLineage]
  );

  // Transform KnowNodes & GhostNodes into React Flow Nodes
  const initialNodes = useMemo(() => {
    if (!currentWorkspace) return [];
    const rfNodes: Node[] = [];

    // 1. Regular turns
    Object.values(currentWorkspace.nodes).forEach((kn) => {
      rfNodes.push({
        id: kn.id,
        type: kn.role === 'user' ? 'userTurn' : 'assistantTurn',
        position: kn.position,
        data: {
          node: kn,
          isInActiveLineage: activeLineageIds.has(kn.id),
        },
      });

      // 2. Ghost Nodes
      kn.ghostNodes?.forEach((ghost, idx) => {
        rfNodes.push({
          id: ghost.id,
          type: 'ghostNode',
          position: ghost.position || {
            x: kn.position.x + 380,
            y: kn.position.y + idx * 110 - 20,
          },
          data: {
            ghost,
          },
        });
      });
    });

    return rfNodes;
  }, [currentWorkspace, activeLineageIds]);

  // Transform DAG parent-child & cross-branch insight edges into React Flow Edges
  const initialEdges = useMemo(() => {
    if (!currentWorkspace) return [];
    const rfEdges: Edge[] = [];

    // 1. Lineage parent-child edges
    Object.values(currentWorkspace.nodes).forEach((kn) => {
      if (kn.parentId && currentWorkspace.nodes[kn.parentId]) {
        const isLineageTarget = activeLineageIds.has(kn.id);
        rfEdges.push({
          id: `edge-${kn.parentId}-${kn.id}`,
          source: kn.parentId,
          target: kn.id,
          type: 'lineage',
          data: {
            isInActiveLineage: isLineageTarget,
          },
        });
      }

      // Connect assistant turns to their ghost nodes
      kn.ghostNodes?.forEach((ghost) => {
        rfEdges.push({
          id: `ghost-edge-${kn.id}-${ghost.id}`,
          source: kn.id,
          target: ghost.id,
          type: 'lineage',
          style: {
            stroke: 'rgba(168, 85, 247, 0.35)',
            strokeDasharray: '4,4',
            strokeWidth: 1.2,
          },
        });
      });
    });

    // 2. Cross-Branch Insight Edges
    currentWorkspace.insightEdges?.forEach((insight) => {
      rfEdges.push({
        id: `insight-edge-${insight.id}`,
        source: insight.sourceNodeId,
        target: insight.targetNodeId,
        type: 'insight',
        data: {
          insight,
        },
      });
    });

    return rfEdges;
  }, [currentWorkspace, activeLineageIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Feature 2: Context Hop & 450ms Camera Panning
  const panToActiveNode = useCallback(
    (targetId: string) => {
      const targetNode = currentWorkspace?.nodes[targetId];
      if (targetNode) {
        setCenter(targetNode.position.x + 160, targetNode.position.y + 90, {
          zoom: 0.95,
          duration: 450,
        });
      }
    },
    [currentWorkspace, setCenter]
  );

  useEffect(() => {
    if (activeNodeId) {
      panToActiveNode(activeNodeId);
    }
  }, [activeNodeId, panToActiveNode]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Canvas Top Bar Controls Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '14px',
          right: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          <div
            style={{
              background: 'rgba(12, 18, 34, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-card)',
              borderRadius: '8px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              color: '#cbd5e1',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
            }}
          >
            <Compass size={13} style={{ color: '#38bdf8' }} />
            <span>Reasoning Graph Topology</span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>
              {Object.keys(currentWorkspace?.nodes || {}).length} Nodes
            </span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={11} />
              {currentWorkspace?.insightEdges?.length || 0} Insights
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          <button
            onClick={() => panToActiveNode(activeNodeId)}
            style={{
              background: 'rgba(17, 26, 46, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              color: '#38bdf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 500,
            }}
            title="Pan camera to active leaf node"
          >
            <Sparkles size={12} />
            Focus Active Node
          </button>

          <button
            onClick={() => recalculateAutoLayout()}
            style={{
              background: 'rgba(17, 26, 46, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border-card)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              color: '#e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Re-run Dagre hierarchical LR layout engine"
          >
            <LayoutDashboard size={12} />
            Dagre Auto-Layout
          </button>

          <button
            onClick={toggleCanvasFullscreen}
            style={{
              background: 'rgba(17, 26, 46, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border-card)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              color: '#e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Toggle canvas fullscreen"
          >
            {isCanvasFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Main React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.6}
        defaultEdgeOptions={{ type: 'lineage' }}
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls position="bottom-right" />
        <MiniMap
          position="bottom-left"
          nodeColor={(n) => {
            if (n.type === 'userTurn') return '#0284c7';
            if (n.type === 'assistantTurn') return '#6366f1';
            return '#a855f7';
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{ width: 140, height: 90 }}
        />
      </ReactFlow>

      {/* Feature 3: Insight Comparison Drawer */}
      <InsightComparisonDrawer />
    </div>
  );
};

export const KnowledgeGraphCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
};
