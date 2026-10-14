import { create } from 'zustand';
import { 
  Workspace, 
  KnowNode, 
  SelectionState, 
  TextAnchorPayload, 
  InsightEdgeData, 
  GhostNodeData,
  ToolInvocation 
} from '../types';
import { SEED_WORKSPACES } from '../data/seedWorkspaces';
import { runAutonomousReasoningPipeline } from '../services/reasoningPipeline';
import { scanForCrossBranchInsights } from '../services/insightAnalyzer';
import { calculateDagreLayout } from '../lib/layoutEngine';

export interface WorkspaceStoreState {
  workspaces: Record<string, Workspace>;
  activeWorkspaceId: string;
  activeNodeId: string;
  activeLineage: KnowNode[];
  selection: SelectionState;
  
  // Streaming & Pipeline Execution State
  isStreaming: boolean;
  streamingStatus: string;
  streamingChunk: string;
  activeToolInvocation: ToolInvocation | null;
  
  // Modals & Panels
  activeInsightComparison: InsightEdgeData | null;
  selectedInspectorNodeId: string | null;
  isCanvasFullscreen: boolean;

  // Actions
  switchWorkspace: (workspaceId: string) => void;
  setActiveNodeId: (nodeId: string, shouldPan?: boolean) => void;
  setSelection: (selection: SelectionState) => void;
  clearSelection: () => void;
  submitInlineFork: (parentNodeId: string, prompt: string, anchor?: TextAnchorPayload) => Promise<void>;
  submitLinearPrompt: (prompt: string) => Promise<void>;
  materializeGhostNode: (ghostId: string) => Promise<void>;
  openInsightComparison: (edge: InsightEdgeData) => void;
  closeInsightComparison: () => void;
  setSelectedInspectorNodeId: (nodeId: string | null) => void;
  toggleCanvasFullscreen: () => void;
  updateNodePosition: (nodeId: string, pos: { x: number; y: number }) => void;
  recalculateAutoLayout: () => void;
  exportWorkspaceJSON: () => string;
  importWorkspaceJSON: (jsonString: string) => boolean;
}

// Helper: Calculate Lineage Path P(N) = [Root, ..., Parent(N), N]
export function resolveLineagePath(nodes: Record<string, KnowNode>, leafNodeId: string): KnowNode[] {
  if (!leafNodeId || !nodes[leafNodeId]) return [];
  const path: KnowNode[] = [];
  let curr: KnowNode | undefined = nodes[leafNodeId];
  const visited = new Set<string>();

  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    path.unshift(curr);
    if (!curr.parentId) break;
    curr = nodes[curr.parentId];
  }

  // Feature 4: Smart Leaf Compression for turns older than 2 when depth > 5
  if (path.length > 5) {
    return path.map((node, index) => {
      const isAncient = index > 0 && index < path.length - 2;
      if (isAncient && !node.isCompressed) {
        return {
          ...node,
          isCompressed: true,
          compression: {
            nodeId: node.id,
            summaryContent: node.rawContent.slice(0, 140) + '... [Semantic summary compressed for token optimization]',
            compressedTokenCount: Math.min(node.tokenCount, 35),
            compressionRatio: 0.25,
            preservedAnchors: node.selectionAnchor ? [node.selectionAnchor.selectedText] : [],
          },
        };
      }
      return node;
    });
  }

  return path;
}

const initialWorkspaceId = 'workspace-distributed-systems';
const initialWorkspace = SEED_WORKSPACES[initialWorkspaceId];
const initialLineage = resolveLineagePath(initialWorkspace.nodes, initialWorkspace.activeNodeId);

export const useWorkspaceStore = create<WorkspaceStoreState>((set, get) => ({
  workspaces: SEED_WORKSPACES,
  activeWorkspaceId: initialWorkspaceId,
  activeNodeId: initialWorkspace.activeNodeId,
  activeLineage: initialLineage,
  
  selection: {
    isActive: false,
    messageId: null,
    selectedText: '',
    startOffset: 0,
    endOffset: 0,
    boundingRect: null,
  },

  isStreaming: false,
  streamingStatus: '',
  streamingChunk: '',
  activeToolInvocation: null,
  activeInsightComparison: null,
  selectedInspectorNodeId: null,
  isCanvasFullscreen: false,

  switchWorkspace: (workspaceId: string) => {
    const ws = get().workspaces[workspaceId];
    if (!ws) return;
    const lineage = resolveLineagePath(ws.nodes, ws.activeNodeId);
    set({
      activeWorkspaceId: workspaceId,
      activeNodeId: ws.activeNodeId,
      activeLineage: lineage,
      activeInsightComparison: null,
      selectedInspectorNodeId: null,
    });
    get().clearSelection();
  },

  setActiveNodeId: (nodeId: string, _shouldPan = true) => {
    const { workspaces, activeWorkspaceId } = get();
    const ws = workspaces[activeWorkspaceId];
    if (!ws || !ws.nodes[nodeId]) return;

    const updatedLineage = resolveLineagePath(ws.nodes, nodeId);
    set({
      activeNodeId: nodeId,
      activeLineage: updatedLineage,
      selectedInspectorNodeId: nodeId,
    });
  },

  setSelection: (selection: SelectionState) => {
    set({ selection });
  },

  clearSelection: () => {
    set({
      selection: {
        isActive: false,
        messageId: null,
        selectedText: '',
        startOffset: 0,
        endOffset: 0,
        boundingRect: null,
      },
    });
  },

  submitInlineFork: async (parentNodeId: string, prompt: string, anchor?: TextAnchorPayload) => {
    const { workspaces, activeWorkspaceId } = get();
    const ws = workspaces[activeWorkspaceId];
    if (!ws) return;

    get().clearSelection();
    set({ isStreaming: true, streamingStatus: 'Initializing fork branch...', streamingChunk: '' });

    const parentNode = ws.nodes[parentNodeId];
    const branchId = `branch-${Date.now()}`;
    const userNodeId = `node-user-${Date.now()}`;
    const assistantNodeId = `node-asst-${Date.now()}`;

    // 1. Create User turn
    const userNode: KnowNode = {
      id: userNodeId,
      workspaceId: ws.id,
      parentId: parentNodeId,
      branchId,
      branchName: `Fork @ ${anchor ? anchor.selectedText.slice(0, 20) + '...' : 'Branch'}`,
      depth: (parentNode?.depth || 0) + 1,
      role: 'user',
      status: 'completed',
      rawContent: prompt,
      tokenCount: Math.ceil(prompt.length / 4),
      selectionAnchor: anchor,
      position: {
        x: (parentNode?.position.x || 400) + 360,
        y: (parentNode?.position.y || 200) - 80,
      },
      createdAt: new Date().toISOString(),
    };

    // Update state with user node
    const updatedNodesWithUser = { ...ws.nodes, [userNodeId]: userNode };
    set((state) => ({
      workspaces: {
        ...state.workspaces,
        [activeWorkspaceId]: {
          ...ws,
          nodes: updatedNodesWithUser,
          activeNodeId: userNodeId,
        },
      },
      activeNodeId: userNodeId,
      activeLineage: resolveLineagePath(updatedNodesWithUser, userNodeId),
    }));

    // 2. Execute Autonomous Reasoning Pipeline (SAIL + FLARE + CRAG + Toolformer)
    try {
      const pipelineResult = await runAutonomousReasoningPipeline({
        userPrompt: prompt,
        parentContent: parentNode?.rawContent || '',
        selectedAnchorText: anchor?.selectedText,
        domainContext: ws.domainContext,
        onStatusUpdate: (status) => set({ streamingStatus: status }),
        onTokenChunk: (chunk) => set((s) => ({ streamingChunk: s.streamingChunk + chunk })),
        onToolInvocation: (tool) => set({ activeToolInvocation: tool }),
      });

      // 3. Assemble Assistant Node
      const assistantNode: KnowNode = {
        id: assistantNodeId,
        workspaceId: ws.id,
        parentId: userNodeId,
        branchId,
        branchName: userNode.branchName,
        depth: userNode.depth + 1,
        role: 'assistant',
        status: 'completed',
        rawContent: pipelineResult.content,
        tokenCount: Math.ceil(pipelineResult.content.length / 4),
        toolInvocations: pipelineResult.toolInvocations,
        retrievalRecord: pipelineResult.retrievalRecord,
        ghostNodes: pipelineResult.ghostNodes.map((g) => ({
          ...g,
          parentNodeId: assistantNodeId,
        })),
        position: {
          x: userNode.position.x + 360,
          y: userNode.position.y,
        },
        createdAt: new Date().toISOString(),
      };

      const finalNodes = {
        ...updatedNodesWithUser,
        [assistantNodeId]: assistantNode,
      };

      // 4. Scan for cross-branch insights
      const newInsights = scanForCrossBranchInsights(assistantNode, finalNodes, ws.insightEdges);

      set((state) => ({
        isStreaming: false,
        streamingStatus: '',
        streamingChunk: '',
        activeToolInvocation: null,
        workspaces: {
          ...state.workspaces,
          [activeWorkspaceId]: {
            ...ws,
            nodes: finalNodes,
            insightEdges: [...ws.insightEdges, ...newInsights],
            activeNodeId: assistantNodeId,
          },
        },
        activeNodeId: assistantNodeId,
        activeLineage: resolveLineagePath(finalNodes, assistantNodeId),
        selectedInspectorNodeId: assistantNodeId,
      }));

      // Auto-recalculate layout
      get().recalculateAutoLayout();
    } catch (err) {
      console.error('Pipeline error:', err);
      set({ isStreaming: false, streamingStatus: 'Error during generation', activeToolInvocation: null });
    }
  },

  submitLinearPrompt: async (prompt: string) => {
    const { activeNodeId } = get();
    if (!activeNodeId) return;
    await get().submitInlineFork(activeNodeId, prompt);
  },

  materializeGhostNode: async (ghostId: string) => {
    const { workspaces, activeWorkspaceId } = get();
    const ws = workspaces[activeWorkspaceId];
    if (!ws) return;

    let targetGhost: GhostNodeData | undefined;
    let parentAssistantNode: KnowNode | undefined;

    for (const node of Object.values(ws.nodes)) {
      if (node.ghostNodes) {
        const found = node.ghostNodes.find((g) => g.id === ghostId);
        if (found) {
          targetGhost = found;
          parentAssistantNode = node;
          break;
        }
      }
    }

    if (!targetGhost || !parentAssistantNode) return;

    // Mark ghost as materialized
    targetGhost.isMaterialized = true;

    // Fork prompt from this assistant turn
    await get().submitInlineFork(parentAssistantNode.id, targetGhost.suggestedPrompt);
  },

  openInsightComparison: (edge: InsightEdgeData) => {
    set({ activeInsightComparison: edge });
  },

  closeInsightComparison: () => {
    set({ activeInsightComparison: null });
  },

  setSelectedInspectorNodeId: (nodeId: string | null) => {
    set({ selectedInspectorNodeId: nodeId });
  },

  toggleCanvasFullscreen: () => {
    set((state) => ({ isCanvasFullscreen: !state.isCanvasFullscreen }));
  },

  updateNodePosition: (nodeId: string, pos: { x: number; y: number }) => {
    const { workspaces, activeWorkspaceId } = get();
    const ws = workspaces[activeWorkspaceId];
    if (!ws || !ws.nodes[nodeId]) return;

    set((state) => ({
      workspaces: {
        ...state.workspaces,
        [activeWorkspaceId]: {
          ...ws,
          nodes: {
            ...ws.nodes,
            [nodeId]: {
              ...ws.nodes[nodeId],
              position: pos,
            },
          },
        },
      },
    }));
  },

  recalculateAutoLayout: () => {
    const { workspaces, activeWorkspaceId } = get();
    const ws = workspaces[activeWorkspaceId];
    if (!ws) return;

    const layoutedNodes = calculateDagreLayout(ws.nodes);
    set((state) => ({
      workspaces: {
        ...state.workspaces,
        [activeWorkspaceId]: {
          ...ws,
          nodes: layoutedNodes,
        },
      },
    }));
  },

  exportWorkspaceJSON: () => {
    const { workspaces, activeWorkspaceId } = get();
    const ws = workspaces[activeWorkspaceId];
    return JSON.stringify(ws, null, 2);
  },

  importWorkspaceJSON: (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString) as Workspace;
      if (!parsed.id || !parsed.nodes) return false;

      set((state) => ({
        workspaces: {
          ...state.workspaces,
          [parsed.id]: parsed,
        },
        activeWorkspaceId: parsed.id,
        activeNodeId: parsed.activeNodeId || Object.keys(parsed.nodes)[0],
        activeLineage: resolveLineagePath(parsed.nodes, parsed.activeNodeId),
      }));
      return true;
    } catch {
      return false;
    }
  },
}));
