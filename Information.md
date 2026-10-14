# Technical Specification Document (PRD / Architecture Spec)

**Project Name:** Know map

**Document Version:** 2.0.0 (Autonomous Agentic & Active Retrieval Architecture)

**Target Audience:** Lead Engineers, AI Implementation Agents, System Architects

**Status:** Approved for Implementation

---

## 1. Executive Summary & Architectural Overview

**Know map** is an interactive, non-linear reasoning workspace and knowledge graph canvas engineered for deep-domain investigation across computer science, medicine, jurisprudence, history, and systems architecture. Conventional conversational agents flatten research into ephemeral, linear dialogue chains. Know map represents inquiry as a **Directed Acyclic Graph (DAG)** where users can fork inquiries at arbitrary character offsets within assistant turns, hop across contextual timelines, visualize hidden thematic bridges, and autonomously verify facts using active retrieval and tool-use mechanics.

Version 2.0 integrates an autonomous knowledge verification and retrieval-augmented reasoning pipeline based on four foundational paradigms:

1. **Toolformer Engine:** Inline, token-level autonomous tool selection and invocation (code execution, algebraic computation, domain search APIs).
2. **FLARE (Forward-Looking Active REtrieval):** Prospective generation monitoring that halts output when prediction confidence drops below a threshold, dynamically triggering retrieval queries before generating uncertain claims.
3. **CRAG (Corrective Retrieval-Augmented Generation):** A self-correcting evaluation layer that grades retrieved document relevance into confidence bands, executing query rewriting and external web-search fallbacks when internal corpora are insufficient or contradictory.
4. **SAIL (Search-Augmented In-Context / Instruction Learning):** Dense prompt conditioning and multi-step reasoning traces that ground the model on verified external corpus evidence, preventing parametric hallucination during branch synthesis.

```
                                  [ User Root Inquiry ]
                                            |
                      +---------------------+---------------------+
                      |    Know map Autonomous Reasoning Pipeline   |
                      |                                           |
                      |  [ FLARE Forward Monitor: P(w) < θ? ]     |
                      |                 |                         |
                      |       (Uncertainty Detected)              |
                      |                 v                         |
                      |  [ Toolformer / Retrieval Query ]         |
                      |                 v                         |
                      |  [ CRAG Retrieval Evaluator ]             |
                      |      /          |            \            |
                      |  (Correct)  (Ambiguous)  (Incorrect)     |
                      |     |       /         \       |           |
                      |  Refine   Internal   Web    Fallback      |
                      |  Docs     Knowledge  Search Search        |
                      |      \         \     /       /            |
                      |   [ SAIL Context & Evidence Fusion ]      |
                      +---------------------+---------------------+
                                            |
                              [ Assistant Response Node ]
                               /            |            \
            (Inline Selection A)            |     (Inline Selection B)
                   /                        |              \
         [ User Branch 1A ]                 |       [ User Branch 1B ]
                 |                          |               |
       [ Assistant Node 2A ]                |      [ Assistant Node 2B ]
          /      |      \                   |               :
       [G1]     [G2]    [G3]                |               :
        (Ghost Horizon Nodes)               |               :
          :                                 |               :
          + - - - - - - - [ Cross-Branch Insight Edge ] - - +
                       (Contradiction / Synergy Detected)

```

---

## SECTION A: Comprehensive Functional Requirements

### A.1 Inline Highlighting & Branch Forking Mechanics

#### A.1.1 DOM Selection Capture & Coordinate Normalization

1. **Selection Detection:**
* Listen to `selectionchange` on the document level, debounced at `50ms`.
* Constrain capture to elements possessing the `data-selectable-message="true"` attribute.
* Ignore collapsed selections (caret clicks) and cross-message drag operations.


2. **Coordinate Normalization:**
* Extract bounding box via `range.getBoundingClientRect()`.
* Calculate portal coordinates relative to the nearest scrolling viewport container:

$$\text{Top} = \text{rect.bottom} + \text{scrollContainer.scrollTop} + 8\,\text{px}$$


$$\text{Left} = \max\left(16\,\text{px}, \min\left(\text{rect.left} + \frac{\text{rect.width}}{2} - \frac{\text{popoverWidth}}{2}, \text{viewportWidth} - \text{popoverWidth} - 16\,\text{px}\right)\right)$$




3. **Range Serialization Payload:**
```typescript
interface TextAnchorPayload {
  parentNodeId: string;
  selectedText: string;
  startOffset: number;       // Character index within raw Markdown source
  endOffset: number;         // Character index within raw Markdown source
  domPath: string;           // CSS selector path from message root
  contextSnippet: {
    prefix: string;          // 32 characters preceding selection
    suffix: string;          // 32 characters following selection
  };
}

```


4. **Boundary Robustness:**
* Syntax-highlighted code fences (`````) are stripped of inner HTML tags before computing start/end offsets against the raw underlying code block.
* If Markdown undergoes dynamic re-renders, use the `contextSnippet` prefix/suffix for fuzzy Levenshtein alignment.



#### A.1.2 Inline Floating Input Box

* **Mount Behavior:** Mounts an inline portal (`InlinePromptPopover`) immediately beneath the selection bounding rect.
* **Interactions:** Auto-focuses the input; dynamic auto-grow textarea (from `36px` to `140px`); displays a truncated quote pill of the highlighted text.
* **Keyboard Shortcuts:** `Enter` commits and forks; `Escape` aborts; `Shift + Enter` inserts a newline.

---

### A.2 Dual-Pane Workspace & Lineage Path Resolution

1. **Lineage Path Calculation:**
For any targeted active node $N$, the active lineage path $P(N)$ is the unique ancestor sequence from root $R$ to $N$:

$$P(N) = [R, \dots, \text{Parent}(\text{Parent}(N)), \text{Parent}(N), N]$$


2. **Chat Stream Rendering:**
The Chat View renders **strictly** nodes contained within $P(N)$. Non-lineage siblings and alternate branches are unmounted from the chat DOM, eliminating clutter while remaining intact in database storage and canvas memory.
3. **Knowledge Graph Canvas:**
Visualizes the complete tree topology.
* **Nodes:** User Turns, Assistant Turns, Tool Execution Cards, Evidence Citations, Ghost Nodes.
* **Edges:** Solid directed edges (parent-child lineage), Dotted orange/purple splines (Cross-Branch Insights), Translucent dashed connectors (AI Horizon Ghost Nodes).



---

### A.3 Active Retrieval, Tool Use & Corrective Reasoning Engines

#### A.3.1 FLARE (Forward-Looking Active REtrieval) Engine

* **Trigger Condition:** During streaming generation, the engine evaluates the model's token-level log probabilities. For a candidate sentence $S = [w_1, w_2, \dots, w_k]$, compute the minimum token probability:

$$\min_{1 \le i \le k} P(w_i \mid w_{<i}) < \theta_{\text{FLARE}} \quad (\text{default threshold } \theta = 0.35)$$


* **Execution Loop:**
1. If any token falls below $\theta_{\text{FLARE}}$, pause generation of that sentence.
2. Strip low-confidence tokens and generate a targeted search query based on the partial sentence context:

$$Q_{\text{FLARE}} = \text{ExtractQuery}(S_{< \text{uncertain}})$$


3. Route $Q_{\text{FLARE}}$ to the CRAG verification pipeline.
4. Inject retrieved knowledge passages into the active generation buffer as transient context and regenerate the sentence.



#### A.3.2 CRAG (Corrective Retrieval-Augmented Generation) Pipeline

* **Evaluation Mechanism:** Given query $Q$ and retrieved document set $\mathcal{D} = \{d_1, d_2, \dots, d_m\}$, a fine-tuned evaluator models confidence score $\mathcal{S}(d_i) \in [0, 1]$.
* **Confidence Tiers:**
1. **Correct ($\mathcal{S} \ge 0.75$):** Document is directly relevant. Pass through the *Knowledge Refinement* step: segment documents into semantic sentences, filter noise, and retain core evidence.
2. **Incorrect ($\mathcal{S} < 0.30$):** Retrieved passages are irrelevant or hallucinated. Discard passages entirely and invoke an external Web Search API fallback.
3. **Ambiguous ($0.30 \le \mathcal{S} < 0.75$):** Partial relevance. Combine refined internal document passages with a decomposed external web search query.


* **Graph Representation:** CRAG evaluation events render as interactive verification chips directly on assistant node cards (e.g., `Verified via PubMed`, `Web Fallback Triggered`).

#### A.3.3 Toolformer Autonomous Tool Execution Engine

* **Autonomous Tool Trigger:** The system recognizes structured tool invocation tokens generated inline during inference:
```text
[TOOL:tool_name(param_1="val_1", param_2="val_2")]

```


* **Supported System Tools:**
* `python_sandbox(script: string)`: Executes deterministic computation, data manipulation, or graph generation within a secure firewalled sandbox.
* `algebra_eval(expression: string)`: Symbolic math computation (SymPy).
* `vector_search(query: string, domain: string)`: Local workspace / indexed document retrieval.
* `web_search(query: string)`: Real-time search engine query execution.
* `arxiv_search(id_or_terms: string)`: Pulls abstracts, authors, and preprints.


* **Execution Lifecycle:**
1. Parser intercepts `[TOOL:...]` token sequence during token streaming.
2. Stream pauses; client UI displays an active execution spinner within the streaming message card.
3. Backend dispatches the execution request.
4. Output is formatted as `[RESULT: ...]` and appended to the generation context.
5. Inference resumes, citing the tool output.



#### A.3.4 SAIL (Search-Augmented In-Context Learning) Engine

* **Instruction Grounding:** Rather than raw zero-shot completion, every model turn is framed through an instruction contract enforcing:
1. *Source Provenance:* Explicit attribution to refined document chunks.
2. *Refusal on Contradiction:* Flagging internal contradictions between retrieved evidence and user assertions.
3. *Lineage Relevance:* Incorporating ancestor branch selections into the search query generator.



---

### A.4 Core Advanced Features

#### Feature 1: AI Horizon (Predictive Ghost Nodes)

* Upon completing an assistant turn, generate 3 orthogonal exploration vectors:
* `critical_counter`: Challenge assumptions, stress-test assertions.
* `mechanistic_deepdive`: Lower-level technical mechanics, code execution, mathematical proofs.
* `adjacent_transfer`: Applying the active paradigm to an adjacent domain.


* Rendered on the Canvas as semi-transparent cards. Clicking a ghost node executes the branch prompt immediately.

#### Feature 2: Context Hop & Canvas Snapshot

* Every node records a `canvas_snapshot` (x, y, zoom, active branch ID).
* Clicking a historical node executes a coordinated 450ms cubic-bezier camera translation on the Canvas, while the Chat View updates its state to display $P(N_{\text{target}})$.

#### Feature 3: Cross-Branch Insights

* An asynchronous worker compares finalized nodes across disparate branches using cosine similarity:

$$\text{CosineSim}(\mathbf{A}, \mathbf{B}) \ge 0.82 \quad \text{where } B \notin P(A)$$


* LLM evaluates the pair for `CONTRADICTION`, `SYNERGY`, or `ANALOGY`.
* Persistent results are stored in `insight_edges` and displayed as animated spline edges between the corresponding nodes on the Canvas.

#### Feature 4: Smart Leaf Compression (Token Optimization)

* When lineage depth $> 5$ turns or token length $> 4,000$, ancestor turns older than 2 turns are condensed into dense semantic summaries.
* Selected anchor substrings and tool execution outputs are permanently preserved and exempt from compression.

---

## SECTION B: Concrete Data Models & State Architecture

### B.1 Complete PostgreSQL DDL (with pgvector & Agent Tables)

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enumerated Types
CREATE TYPE node_role_enum AS ENUM ('system', 'user', 'assistant');
CREATE TYPE node_status_enum AS ENUM ('pending', 'streaming', 'completed', 'error');
CREATE TYPE insight_type_enum AS ENUM ('contradiction', 'synergy', 'analogy', 'dependency');
CREATE TYPE ghost_vector_type_enum AS ENUM ('critical_counter', 'mechanistic_deepdive', 'adjacent_transfer');
CREATE TYPE crag_eval_status_enum AS ENUM ('correct', 'ambiguous', 'incorrect');
CREATE TYPE tool_call_status_enum AS ENUM ('invoked', 'running', 'success', 'failed');

-- 1. Workspaces Container
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled Research Session',
    domain_context VARCHAR(100) DEFAULT 'general',
    active_node_id UUID,
    canvas_viewport JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "zoom": 1.0}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Nodes (Vertices of the Reasoning DAG)
CREATE TABLE nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL,
    depth INT NOT NULL DEFAULT 0,
    role node_role_enum NOT NULL,
    status node_status_enum NOT NULL DEFAULT 'completed',
    raw_content TEXT NOT NULL,
    token_count INT NOT NULL DEFAULT 0,
    
    -- Selection Anchoring
    selection_anchor JSONB DEFAULT NULL,
    /* Schema:
       {
         "parent_node_id": "UUID",
         "selected_text": "string",
         "start_offset": 120,
         "end_offset": 185,
         "context_snippet": {"prefix": "...", "suffix": "..."}
       }
    */

    -- Spatial Position on Canvas
    position_x FLOAT NOT NULL DEFAULT 0.0,
    position_y FLOAT NOT NULL DEFAULT 0.0,
    
    -- State & Embeddings
    is_compressed BOOLEAN NOT NULL DEFAULT FALSE,
    embedding vector(1536),
    
    -- Metadata (Model tags, latencies, flare query triggers)
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workspaces 
ADD CONSTRAINT fk_workspaces_active_node 
FOREIGN KEY (active_node_id) REFERENCES nodes(id) ON DELETE SET NULL;

-- 3. Toolformer Tool Invocations
CREATE TABLE tool_invocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    tool_name VARCHAR(64) NOT NULL,
    parameters JSONB NOT NULL,
    execution_result TEXT,
    status tool_call_status_enum NOT NULL DEFAULT 'invoked',
    execution_duration_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Retrieval & CRAG Verification Chunks
CREATE TABLE retrieval_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    retrieval_trigger VARCHAR(32) NOT NULL, -- 'FLARE', 'SAIL_INIT', 'USER_EXPLICIT'
    raw_passages JSONB NOT NULL,            -- Array of retrieved raw docs
    evaluation_status crag_eval_status_enum NOT NULL,
    evaluation_score FLOAT NOT NULL,
    refined_evidence TEXT,                  -- Compressed/filtered text after CRAG
    fallback_search_query TEXT,             -- Search query if fallback was used
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Node Compressions (Leaf Compression)
CREATE TABLE node_compressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id UUID NOT NULL UNIQUE REFERENCES nodes(id) ON DELETE CASCADE,
    summary_content TEXT NOT NULL,
    compressed_token_count INT NOT NULL,
    compression_ratio FLOAT NOT NULL,
    preserved_anchors JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Predictive Ghost Nodes (AI Horizon)
CREATE TABLE ghost_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    label VARCHAR(120) NOT NULL,
    suggested_prompt TEXT NOT NULL,
    vector_type ghost_vector_type_enum NOT NULL,
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    is_materialized BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Cross-Branch Insight Edges
CREATE TABLE insight_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    insight_type insight_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    analysis TEXT NOT NULL,
    similarity_score FLOAT NOT NULL,
    is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_insight_pair UNIQUE (source_node_id, target_node_id, insight_type)
);

-- Production Indexes
CREATE INDEX idx_nodes_workspace_depth ON nodes(workspace_id, depth);
CREATE INDEX idx_nodes_parent ON nodes(parent_id);
CREATE INDEX idx_nodes_branch ON nodes(branch_id);
CREATE INDEX idx_nodes_embedding ON nodes USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_retrieval_records_node ON retrieval_records(node_id);
CREATE INDEX idx_tool_invocations_node ON tool_invocations(node_id);
CREATE INDEX idx_ghost_nodes_parent ON ghost_nodes(parent_node_id);
CREATE INDEX idx_insight_edges_workspace ON insight_edges(workspace_id);

```

---

### B.2 Unified Client State Architecture (Zustand)

```typescript
// src/types/store.ts
import { Node, Edge, Viewport } from '@xyflow/react';

export interface SelectionState {
  isActive: boolean;
  messageId: string | null;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  boundingRect: { top: number; left: number; bottom: number; right: number; width: number } | null;
}

export interface LineageNodeData {
  id: string;
  parentId: string | null;
  branchId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  isCompressed: boolean;
  summary?: string;
  selectionAnchor?: {
    parentNodeId: string;
    selectedText: string;
    startOffset: number;
    endOffset: number;
  };
  toolInvocations?: Array<{
    id: string;
    toolName: string;
    status: 'running' | 'success' | 'failed';
    result?: string;
  }>;
  retrievalMetadata?: {
    evalStatus: 'correct' | 'ambiguous' | 'incorrect';
    evidenceSnippet?: string;
  };
}

export interface WorkspaceStore {
  // Navigation & Lineage
  activeNodeId: string | null;
  activeLineage: LineageNodeData[];
  isStreaming: boolean;
  streamingChunk: string;
  setActiveNodeId: (nodeId: string) => Promise<void>;
  
  // Selection & Branching
  selection: SelectionState;
  setSelection: (selection: SelectionState) => void;
  clearSelection: () => void;
  submitInlineFork: (prompt: string) => Promise<void>;

  // Canvas / Graph
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  panToNode: (nodeId: string, duration?: number) => void;
  syncLineageToCanvas: (lineageIds: string[]) => void;
  materializeGhostNode: (ghostId: string) => Promise<void>;
}

```

```typescript
// src/store/useWorkspaceStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { WorkspaceStore, LineageNodeData } from '@/types/store';

export const useWorkspaceStore = create<WorkspaceStore>()(
  devtools((set, get) => ({
    activeNodeId: null,
    activeLineage: [],
    isStreaming: false,
    streamingChunk: '',

    selection: {
      isActive: false,
      messageId: null,
      selectedText: '',
      startOffset: 0,
      endOffset: 0,
      boundingRect: null,
    },

    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1.0 },

    setSelection: (selection) => set({ selection }),
    clearSelection: () =>
      set({
        selection: {
          isActive: false,
          messageId: null,
          selectedText: '',
          startOffset: 0,
          endOffset: 0,
          boundingRect: null,
        },
      }),

    setActiveNodeId: async (nodeId: string) => {
      const res = await fetch(`/api/workspace/lineage?leafNodeId=${nodeId}`);
      const data = await res.json();
      
      set({
        activeNodeId: nodeId,
        activeLineage: data.lineage,
      });

      get().panToNode(nodeId);
      get().syncLineageToCanvas(data.lineage.map((n: LineageNodeData) => n.id));
    },

    submitInlineFork: async (prompt: string) => {
      const { selection, activeNodeId } = get();
      if (!selection.messageId) return;

      const payload = {
        parentNodeId: selection.messageId,
        prompt,
        selectionAnchor: {
          parentNodeId: selection.messageId,
          selectedText: selection.selectedText,
          startOffset: selection.startOffset,
          endOffset: selection.endOffset,
        },
      };

      get().clearSelection();
      set({ isStreaming: true, streamingChunk: '' });

      // Handled via SSE client hook in useSSEStreaming
      const eventSource = new EventSource(
        `/api/chat/branch?payload=${encodeURIComponent(JSON.stringify(payload))}`
      );

      eventSource.addEventListener('token', (e) => {
        const data = JSON.parse(e.data);
        set((state) => ({ streamingChunk: state.streamingChunk + data.chunk }));
      });

      eventSource.addEventListener('done', (e) => {
        const data = JSON.parse(e.data);
        eventSource.close();
        set({ isStreaming: false, streamingChunk: '' });
        get().setActiveNodeId(data.nodeId);
      });
    },

    panToNode: (nodeId: string, duration = 450) => {
      const node = get().nodes.find((n) => n.id === nodeId);
      if (!node) return;
      
      const targetX = -node.position.x + window.innerWidth * 0.25;
      const targetY = -node.position.y + window.innerHeight * 0.35;
      set({ viewport: { x: targetX, y: targetY, zoom: 1.15 } });
    },

    syncLineageToCanvas: (lineageIds: string[]) => {
      set((state) => ({
        nodes: state.nodes.map((node) => ({
          ...node,
          selected: node.id === state.activeNodeId,
          data: {
            ...node.data,
            isInActiveLineage: lineageIds.includes(node.id),
          },
        })),
        edges: state.edges.map((edge) => ({
          ...edge,
          animated: lineageIds.includes(edge.target),
          style: {
            ...edge.style,
            stroke: lineageIds.includes(edge.target) ? '#3b82f6' : '#94a3b8',
            strokeWidth: lineageIds.includes(edge.target) ? 2.5 : 1.0,
          },
        })),
      }));
    },

    materializeGhostNode: async (ghostId: string) => {
      const res = await fetch(`/api/workspace/ghost/materialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghostId }),
      });
      const data = await res.json();
      await get().setActiveNodeId(data.newNodeId);
    },

    onNodesChange: (changes) => {},
    onEdgesChange: (changes) => {},
  }))
);

```

---

## SECTION C: LLM Orchestration, Active Retrieval & Tool Management

### C.1 The Context Assembly Pipeline (SAIL Framework)

The SAIL context builder constructs prompt payloads bounded by strict token budgets, integrating compressed ancestor digests, explicit inline user selections, and verified CRAG knowledge passages.

```typescript
// src/server/orchestration/sailContextAssembler.ts
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export interface ContextTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function assembleSailContext(
  leafNodeId: string,
  tokenBudget: number = 8192
): Promise<ContextTurn[]> {
  // 1. Recursive SQL traversal of the active lineage path
  const lineage = await db.execute(sql`
    WITH RECURSIVE lineage AS (
      SELECT id, parent_id, depth, role, raw_content, token_count, 
             selection_anchor, is_compressed, created_at
      FROM nodes WHERE id = ${leafNodeId}
      UNION ALL
      SELECT p.id, p.parent_id, p.depth, p.role, p.raw_content, p.token_count, 
             p.selection_anchor, p.is_compressed, p.created_at
      FROM nodes p
      JOIN lineage l ON l.parent_id = p.id
    )
    SELECT * FROM lineage ORDER BY depth ASC;
  `);

  const nodes = lineage.rows as any[];
  const context: ContextTurn[] = [];

  // Core SAIL System Instruction
  context.push({
    role: 'system',
    content: `You are Know map's Core Intelligence Engine.
You operate as a multi-domain researcher using autonomous verification (CRAG, FLARE) and integrated tools.
Guiding Principles:
1. Ground every technical claim in verified evidence chunks provided under [EVIDENCE].
2. When answering a branched user inquiry, address the focused user selection without ignoring historical branch developments.
3. If uncertainty arises regarding specific formulas, dates, statutes, or constants, invoke the appropriate [TOOL:tool_name(args)] syntax.`
  });

  const total = nodes.length;
  let remainingBudget = tokenBudget - 1200; // Buffer for instructions, tools, and response headroom

  for (let i = 0; i < total; i++) {
    const node = nodes[i];
    const isRoot = i === 0;
    const isRecent = i >= total - 2;

    if (isRoot || isRecent || !node.is_compressed) {
      let turnContent = node.raw_content;

      // Inject Focused Selection Context if node forked from an inline selection
      if (node.selection_anchor) {
        const anchor = typeof node.selection_anchor === 'string'
          ? JSON.parse(node.selection_anchor)
          : node.selection_anchor;
        turnContent = `[FOCUSED HIGHLIGHT: "${anchor.selected_text}"]\n\n${turnContent}`;
      }

      // Fetch refined CRAG evidence if attached to this turn
      const evidence = await db.query.retrievalRecords.findFirst({
        where: (r, { eq }) => eq(r.nodeId, node.id),
      });

      if (evidence && evidence.refinedEvidence) {
        turnContent = `[VERIFIED EVIDENCE (${evidence.evaluationStatus})]:\n${evidence.refinedEvidence}\n\n${turnContent}`;
      }

      context.push({ role: node.role, content: turnContent });
      remainingBudget -= node.token_count;
    } else {
      // Inject Compressed Leaf Summary
      const compression = await db.query.nodeCompressions.findFirst({
        where: (c, { eq }) => eq(c.nodeId, node.id),
      });

      if (compression) {
        const summary = `[COMPRESSED ANCESTOR SUMMARY]: ${compression.summaryContent}
(Preserved Invariants: ${JSON.stringify(compression.preservedAnchors)})`;
        context.push({ role: node.role, content: summary });
        remainingBudget -= compression.compressedTokenCount;
      } else {
        context.push({ role: node.role, content: `${node.raw_content.slice(0, 250)}... [Truncated]` });
      }
    }
  }

  return context;
}

```

---

### C.2 Real-Time FLARE Monitoring & CRAG Evaluator Orchestration

```typescript
// src/server/ai/flareEvaluator.ts
import { db } from '@/db';
import { retrievalRecords } from '@/db/schema';

interface FlareCheckResult {
  needsRetrieval: boolean;
  uncertainSpan?: string;
  generatedQuery?: string;
}

export function evaluateTokenConfidence(
  sentence: string,
  tokenLogprobs: Array<{ token: string; logprob: number }>
): FlareCheckResult {
  const PROB_THRESHOLD = Math.log(0.35); // Equivalent to P < 0.35

  const lowConfidenceToken = tokenLogprobs.find((t) => t.logprob < PROB_THRESHOLD);
  if (!lowConfidenceToken) {
    return { needsRetrieval: false };
  }

  // Construct search query from sentence context preceding uncertain token
  return {
    needsRetrieval: true,
    uncertainSpan: sentence,
    generatedQuery: sentence.replace(/[^\w\s]/gi, '').trim(),
  };
}

export async function executeCragPipeline(nodeId: string, rawQuery: string) {
  // 1. Internal Vector Search Retrieval
  const internalDocs = await searchInternalCorpus(rawQuery);

  // 2. Evaluate Retrieval Relevance
  const evaluation = await gradeDocumentRelevance(rawQuery, internalDocs);

  let finalEvidence = '';
  let fallbackQuery: string | undefined;

  if (evaluation.status === 'correct') {
    // Knowledge Refinement: Strip noise sentences
    finalEvidence = evaluation.refinedPassages.join('\n');
  } else if (evaluation.status === 'incorrect') {
    // Discard internal passages and fall back to external web search
    fallbackQuery = await formulateSearchQuery(rawQuery);
    const webResults = await executeExternalWebSearch(fallbackQuery);
    finalEvidence = webResults.slice(0, 3).map((r) => r.snippet).join('\n');
  } else {
    // Ambiguous: Fuse refined internal documents with external web snippets
    fallbackQuery = await formulateSearchQuery(rawQuery);
    const webResults = await executeExternalWebSearch(fallbackQuery);
    finalEvidence = [
      ...evaluation.refinedPassages,
      ...webResults.slice(0, 2).map((r) => r.snippet),
    ].join('\n');
  }

  // 3. Persist verification record
  await db.insert(retrievalRecords).values({
    nodeId,
    queryText: rawQuery,
    retrievalTrigger: 'FLARE',
    rawPassages: internalDocs,
    evaluationStatus: evaluation.status,
    evaluationScore: evaluation.score,
    refinedEvidence: finalEvidence,
    fallbackSearchQuery: fallbackQuery,
  });

  return finalEvidence;
}

// Helpers for internal operations
async function searchInternalCorpus(query: string) { return [{ text: "Context snippet..." }]; }
async function gradeDocumentRelevance(query: string, docs: any[]) {
  return { status: 'correct' as const, score: 0.88, refinedPassages: [docs[0]?.text || ''] };
}
async function formulateSearchQuery(query: string) { return `overview ${query}`; }
async function executeExternalWebSearch(query: string) { return [{ snippet: "Web snippet result" }]; }

```

---

### C.3 Toolformer Streaming Token Interceptor

```typescript
// src/server/ai/toolformerInterceptor.ts
export interface ToolCallMatch {
  rawMatch: string;
  toolName: string;
  parameters: Record<string, any>;
}

const TOOL_REGEX = /\[TOOL:([a-zA-Z0-9_]+)\((.*?)\)\]/;

export function extractToolCall(text: string): ToolCallMatch | null {
  const match = text.match(TOOL_REGEX);
  if (!match) return null;

  const [rawMatch, toolName, rawParams] = match;
  const parameters: Record<string, any> = {};

  // Parse key="value" or key=123 argument patterns
  const paramRegex = /([a-zA-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^,\s]+))/g;
  let pMatch;
  while ((pMatch = paramRegex.exec(rawParams)) !== null) {
    const key = pMatch[1];
    const val = pMatch[2] ?? pMatch[3] ?? pMatch[4];
    parameters[key] = isNaN(Number(val)) ? val : Number(val);
  }

  return { rawMatch, toolName, parameters };
}

export async function executeTool(toolName: string, params: Record<string, any>): Promise<string> {
  switch (toolName) {
    case 'algebra_eval':
      return `Computed: ${eval(params.expression)}`; // Production runs in isolated VM
    case 'python_sandbox':
      return `Executed successfully. Result: [Output Data]`;
    case 'web_search':
      return `Top result for ${params.query}: [Verified Fact]`;
    default:
      throw new Error(`Tool ${toolName} not registered`);
  }
}

```

---

### C.4 Structured Outputs Schema Definitions

```typescript
// src/schemas/aiOutputs.ts
import { z } from 'zod';

// AI Horizon (3 Orthogonal Vectors)
export const GhostNodesSchema = z.object({
  vectors: z.array(
    z.object({
      label: z.string().max(50),
      suggested_prompt: z.string().max(300),
      vector_type: z.enum(['critical_counter', 'mechanistic_deepdive', 'adjacent_transfer']),
      reasoning: z.string().max(150),
    })
  ).length(3),
});

// Cross-Branch Insight Analyzer
export const CrossBranchInsightSchema = z.object({
  is_valid_connection: z.boolean(),
  insight_type: z.enum(['contradiction', 'synergy', 'analogy', 'dependency']),
  similarity_score: z.number().min(0).max(1),
  title: z.string().max(80),
  analysis: z.string().max(500),
});

// Leaf Summary Compression
export const LeafCompressionSchema = z.object({
  summary_content: z.string().max(600),
  preserved_anchors: z.array(z.string()),
  estimated_token_count: z.number(),
});

```

---

## SECTION D: Implementation Roadmap for Coding Agents

### D.1 Complete Project Directory Architecture

```
know-map/
├── .env.example
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── drizzle.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── app/
│   │   │   └── [workspaceId]/
│   │   │       ├── page.tsx                     // Dual-Pane Core Application Shell
│   │   │       └── loading.tsx
│   │   └── api/
│   │       ├── chat/
│   │       │   └── branch/route.ts              // SSE Streaming with Tool/FLARE Interceptors
│   │       ├── workspace/
│   │       │   ├── lineage/route.ts             // Recursive Lineage CTE Endpoint
│   │       │   ├── nodes/route.ts               // Node Position Batch Update
│   │       │   └── ghost/
│   │       │       └── materialize/route.ts     // Ghost Node Promotion Endpoint
│   │       └── webhooks/
│   │           └── cron-compress/route.ts
│   ├── components/
│   │   ├── ui/                                  // Radix UI Components
│   │   │   ├── button.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── badge.tsx
│   │   ├── chat/
│   │   │   ├── ChatContainer.tsx                // Virtualized Active Lineage Stream
│   │   │   ├── MessageItem.tsx                  // Markdown Renderer + Highlight Target
│   │   │   ├── InlinePromptPopover.tsx          // Floating Selection Input
│   │   │   ├── ToolExecutionCard.tsx            // Inline Tool Invocation Progress/Output
│   │   │   └── CragVerificationBadge.tsx        // Evidence Attribution Pill
│   │   ├── canvas/
│   │   │   ├── KnowledgeGraphCanvas.tsx         // React Flow Container
│   │   │   ├── nodes/
│   │   │   │   ├── UserTurnNode.tsx
│   │   │   │   ├── AssistantTurnNode.tsx
│   │   │   │   └── GhostNode.tsx                // Translucent Horizon Vector Card
│   │   │   ├── edges/
│   │   │   │   ├── LineageEdge.tsx
│   │   │   │   └── InsightEdge.tsx              // Dotted Cross-Branch Spline
│   │   │   └── panels/
│   │   │       └── InsightComparisonDrawer.tsx  // Split-Screen Semantic Comparison
│   │   └── layout/
│   │       ├── ResizableSplitView.tsx           // Double-Buffered Splitter
│   │       └── WorkspaceHeader.tsx
│   ├── db/
│   │   ├── index.ts                             // Drizzle Client Instance
│   │   └── schema.ts                            // PostgreSQL + pgvector Schema
│   ├── hooks/
│   │   ├── useTextSelection.ts                  // Robust DOM Selection Tracking
│   │   ├── useGraphSync.ts                      // Synchronized Viewport Animations
│   │   └── useSSEStreaming.ts                   // SSE Protocol & Token Stream Parser
│   ├── lib/
│   │   ├── layoutEngine.ts                      // Dagre Graph Auto-Layout Engine
│   │   ├── markdown.ts                          // Markdown Offset Normalizer
│   │   └── vectorUtils.ts                       // Cosine Distance & Math Operations
│   ├── server/
│   │   ├── ai/
│   │   │   ├── client.ts                        // Model Provider Setup
│   │   │   ├── sailContextAssembler.ts          // SAIL Context Reconstruction
│   │   │   ├── flareEvaluator.ts                // FLARE Confidence Checker & CRAG Runner
│   │   │   ├── toolformerInterceptor.ts        // Token-Level Tool Parsing
│   │   │   └── horizonPredictor.ts              // Ghost Node Generator
│   │   └── workers/
│   │       ├── insightAnalyzer.ts               // Asynchronous Cross-Branch Scanner
│   │       └── leafCompressor.ts                // Context Compression Worker
│   ├── store/
│   │   └── useWorkspaceStore.ts                 // Master Zustand Store
│   └── types/
│       ├── database.ts
│       ├── graph.ts
│       └── store.ts

```

---

### D.2 Discrete Agent Implementation Blueprints

#### TASK-01: Database Infrastructure & Drizzle Schema

* **Target Files:** `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`
* **Actions:**
1. Define PostgreSQL schema including `workspaces`, `nodes`, `tool_invocations`, `retrieval_records`, `node_compressions`, `ghost_nodes`, `insight_edges`.
2. Implement `pgvector` column binding (`vector(1536)`).
3. Configure self-referencing foreign keys on `nodes.parent_id`.


* **Validation:** Execute `drizzle-kit push:pg`. Confirm tables, enums, and HNSW indexes initialize without errors.

#### TASK-02: Selection Engine & `useTextSelection` Hook

* **Target Files:** `src/hooks/useTextSelection.ts`, `src/components/chat/InlinePromptPopover.tsx`, `src/components/chat/MessageItem.tsx`
* **Actions:**
1. Implement `useTextSelection(containerRef)` with a 50ms debounced listener on `selectionchange`.
2. Normalize selection rects and compute container-relative coordinates.
3. Extract UTF-16 start/end offsets and 32-character prefix/suffix context strings.
4. Render `InlinePromptPopover` with an auto-expanding textarea directly beneath the selection.


* **Validation:** Highlighting text inside an assistant message displays the popover centered below the selection. Pressing `Escape` unmounts the popover and clears highlights.

#### TASK-03: Lineage Resolver API & Server-Sent Events Endpoint

* **Target Files:** `src/app/api/workspace/lineage/route.ts`, `src/app/api/chat/branch/route.ts`, `src/server/ai/sailContextAssembler.ts`
* **Actions:**
1. Write recursive SQL CTE in `lineage/route.ts` returning the node lineage from Root to Target Node.
2. Build `assembleSailContext()` to bundle ancestors, inline selections, and CRAG evidence within token constraints.
3. Implement `branch/route.ts` streaming tokens back to client via SSE (`event: token`, `event: done`).


* **Validation:** Forking a branch dispatches an SSE stream, renders tokens in real time, and unmounts chronologically following sibling messages.

#### TASK-04: Toolformer Interceptor & Tool Sandbox Execution

* **Target Files:** `src/server/ai/toolformerInterceptor.ts`, `src/components/chat/ToolExecutionCard.tsx`, `src/app/api/chat/branch/route.ts`
* **Actions:**
1. Create regex interceptor for inline tool patterns: `[TOOL:name(args)]`.
2. Pause generation stream on match, emit `event: tool_start`, execute tool, append `[RESULT: ...]`, and resume generation.
3. Render dynamic tool execution cards showing tool parameters and output.


* **Validation:** Prompt requiring arithmetic (`[TOOL:algebra_eval(expression="4^12")]`) triggers the tool execution step, displays the result card, and includes the computed output in the final response.

#### TASK-05: FLARE Active Retrieval & CRAG Evaluator Pipeline

* **Target Files:** `src/server/ai/flareEvaluator.ts`, `src/components/chat/CragVerificationBadge.tsx`
* **Actions:**
1. Add token logprob evaluation check ($\log P(w) < \theta$).
2. On low-confidence detection, pause generation and construct an active retrieval query.
3. Execute CRAG evaluator: grade passages into `correct`, `ambiguous`, or `incorrect`. Trigger web search fallback when graded `incorrect`.
4. Store results in `retrieval_records` and render verification badges in the chat card.


* **Validation:** Generating a response with low-confidence technical assertions triggers the CRAG retrieval flow and renders a verification badge with evidence attribution.

#### TASK-06: Knowledge Graph Canvas (React Flow + Dagre Layout Engine)

* **Target Files:** `src/components/canvas/KnowledgeGraphCanvas.tsx`, `src/components/canvas/nodes/UserTurnNode.tsx`, `src/components/canvas/nodes/AssistantTurnNode.tsx`, `src/lib/layoutEngine.ts`
* **Actions:**
1. Configure `@xyflow/react` surface with custom node and edge renderers.
2. Implement `layoutEngine.ts` using `dagre` to auto-calculate horizontal tree positions (`LR` rank direction).
3. Wire `onNodeClick` to invoke `setActiveNodeId()`, triggering smooth canvas panning and Chat lineage updates.


* **Validation:** Forking branches creates properly positioned downstream nodes without overlap. Clicking an ancestor node pans the canvas and updates the Chat timeline to that historical point.

#### TASK-07: AI Horizon (Predictive Ghost Nodes)

* **Target Files:** `src/server/ai/horizonPredictor.ts`, `src/components/canvas/nodes/GhostNode.tsx`, `src/app/api/workspace/ghost/materialize/route.ts`
* **Actions:**
1. On assistant stream completion, invoke LLM bound to `GhostNodesSchema`.
2. Insert records into `ghost_nodes` and stream back via `event: ghost_nodes`.
3. Render ghost nodes as translucent dashed cards to the right of the parent node.
4. Clicking a ghost node executes the materialized prompt and turns it into an active node.


* **Validation:** Completing an assistant turn renders 3 ghost nodes on the canvas. Clicking one triggers prompt execution and adds it to the active tree.

#### TASK-08: Cross-Branch Insight Analyzer & Leaf Compression Engine

* **Target Files:** `src/server/workers/insightAnalyzer.ts`, `src/server/workers/leafCompressor.ts`, `src/components/canvas/edges/InsightEdge.tsx`
* **Actions:**
1. Asynchronous worker embeds finalized nodes and runs cosine similarity queries ($\ge 0.82$) against non-lineage nodes.
2. LLM evaluates semantic relationships: `CONTRADICTION`, `SYNERGY`, or `ANALOGY`.
3. Persist valid insights to `insight_edges` and render as dotted splines on the canvas.
4. Build compression evaluator: when lineage depth $> 5$, summarize ancestors older than 2 turns via `LeafCompressionSchema`.


* **Validation:** Branches exploring related topics across different disciplines trigger insight edge connections. Branches deeper than 5 turns compress older nodes while retaining anchor highlights.

---

## SECTION E: Verification & Acceptance Test Suite

| Test ID | Test Scenario | Trigger Action | Expected Result | Pass Criteria |
| --- | --- | --- | --- | --- |
| **TC-01** | Inline Text Forking | Highlight sentence in Assistant Turn 2; enter "Explain the legal precedent" in popover. | Assistant Turn 3 is hidden from chat. Node 4 forks from Node 2 on Canvas. Active Lineage updates to `[1, 2, 4]`. | Lineage query returns only `[1, 2, 4]`. DOM shows quote badge with original selection. |
| **TC-02** | Toolformer Execution | Prompt assistant: "Calculate the eigenvalue of [[2, 1], [1, 2]] using Python." | Generation intercepts `[TOOL:python_sandbox(...)]`. Emits `tool_start` event. Inline tool card displays output before continuing response. | Node record has associated `tool_invocations` row with status `success`. |
| **TC-03** | FLARE Confidence Drop & CRAG Fallback | Prompt assistant on obscure, rapidly changing technical details. Token logprob drops below $\theta = 0.35$. | Assistant pauses generation. CRAG evaluator grades internal corpus as `incorrect` ($S < 0.30$). Triggers Web Search fallback. | `retrieval_records` shows `evaluation_status = 'incorrect'`, contains `fallback_search_query`, and renders a verification badge in UI. |
| **TC-04** | Context Hop Snapshot | Click Node 2 on Canvas while viewing Node 6 in Chat. | Canvas camera executes 450ms smooth transition to Node 2. Chat View updates to show only lineage `[1, 2]`. | Viewport coordinates match `canvas_snapshot`. Chat timeline updates cleanly without console errors or race conditions. |
| **TC-05** | Cross-Branch Contradiction | In Branch A, assert "System X uses optimistic locking." In Branch B, assert "System X requires pessimistic 2PL." | Worker detects embedding similarity $\ge 0.82$. LLM identifies semantic conflict. | Canvas renders a dotted orange `InsightEdge` between nodes with badge: "Contradiction Detected". |
| **TC-06** | Leaf Token Compression | Create a linear branch with 12 turns (10,000 raw tokens). | Compresser worker triggers on turns older than turn 10. Generates semantic summaries. | Next prompt payload size measures $< 4,000$ tokens while preserving all highlighted quotes and tool results. |

---

*End of Technical Specification Document. Proceed to Phase 1 (Task 01) execution.*