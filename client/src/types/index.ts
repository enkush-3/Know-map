export type NodeRole = 'system' | 'user' | 'assistant';
export type NodeStatus = 'pending' | 'streaming' | 'completed' | 'error';
export type GhostVectorType = 'critical_counter' | 'mechanistic_deepdive' | 'adjacent_transfer';
export type InsightType = 'contradiction' | 'synergy' | 'analogy' | 'dependency';
export type CragEvalStatus = 'correct' | 'ambiguous' | 'incorrect';
export type ToolCallStatus = 'invoked' | 'running' | 'success' | 'failed';

export interface TextAnchorPayload {
  parentNodeId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  domPath?: string;
  contextSnippet?: {
    prefix: string;
    suffix: string;
  };
}

export interface ToolInvocation {
  id: string;
  nodeId: string;
  toolName: string;
  parameters: Record<string, any>;
  executionResult?: string;
  status: ToolCallStatus;
  executionDurationMs?: number;
  createdAt?: string;
}

export interface RetrievalRecord {
  id: string;
  nodeId: string;
  queryText: string;
  retrievalTrigger: 'FLARE' | 'SAIL_INIT' | 'USER_EXPLICIT';
  rawPassages: string[];
  evaluationStatus: CragEvalStatus;
  evaluationScore: number;
  refinedEvidence: string;
  fallbackSearchQuery?: string;
  createdAt?: string;
}

export interface GhostNodeData {
  id: string;
  parentNodeId: string;
  label: string;
  suggestedPrompt: string;
  vectorType: GhostVectorType;
  reasoning: string;
  isMaterialized: boolean;
  position?: { x: number; y: number };
}

export interface InsightEdgeData {
  id: string;
  workspaceId: string;
  sourceNodeId: string;
  targetNodeId: string;
  insightType: InsightType;
  title: string;
  analysis: string;
  similarityScore: number;
  isDismissed?: boolean;
}

export interface NodeCompression {
  nodeId: string;
  summaryContent: string;
  compressedTokenCount: number;
  compressionRatio: number;
  preservedAnchors: string[];
}

export interface KnowNode {
  id: string;
  workspaceId: string;
  parentId: string | null;
  branchId: string;
  branchName?: string;
  depth: number;
  role: NodeRole;
  status: NodeStatus;
  rawContent: string;
  tokenCount: number;
  selectionAnchor?: TextAnchorPayload;
  toolInvocations?: ToolInvocation[];
  retrievalRecord?: RetrievalRecord;
  ghostNodes?: GhostNodeData[];
  isCompressed?: boolean;
  compression?: NodeCompression;
  position: { x: number; y: number };
  createdAt: string;
  updatedAt?: string;
}

export interface Workspace {
  id: string;
  title: string;
  domainContext: 'distributed_systems' | 'genomics' | 'jurisprudence' | 'custom';
  description: string;
  activeNodeId: string;
  nodes: Record<string, KnowNode>;
  insightEdges: InsightEdgeData[];
  viewport: { x: number; y: number; zoom: number };
}

export interface SelectionState {
  isActive: boolean;
  messageId: string | null;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  boundingRect: {
    top: number;
    left: number;
    bottom: number;
    right: number;
    width: number;
  } | null;
}
