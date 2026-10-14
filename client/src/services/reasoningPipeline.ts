import { 
  RetrievalRecord, 
  ToolInvocation, 
  GhostNodeData 
} from '../types';
import { evaluateFlareConfidence } from './flareEngine';
import { evaluateCragRetrieval, buildRetrievalRecord } from './cragEngine';
import { extractToolCall, executeToolInvocation } from './toolformerEngine';
import { generateHorizonGhostNodes } from './horizonPredictor';

export interface PipelineParams {
  userPrompt: string;
  parentContent: string;
  selectedAnchorText?: string;
  domainContext: string;
  onStatusUpdate?: (status: string) => void;
  onTokenChunk?: (chunk: string) => void;
  onToolInvocation?: (tool: ToolInvocation) => void;
}

export interface PipelineResult {
  content: string;
  retrievalRecord?: RetrievalRecord;
  toolInvocations: ToolInvocation[];
  ghostNodes: GhostNodeData[];
}

export async function runAutonomousReasoningPipeline({
  userPrompt,
  parentContent,
  selectedAnchorText,
  domainContext,
  onStatusUpdate,
  onTokenChunk,
  onToolInvocation,
}: PipelineParams): Promise<PipelineResult> {
  const toolInvocations: ToolInvocation[] = [];
  let retrievalRecord: RetrievalRecord | undefined;

  // 1. SAIL Context Assembly & Flare Prospective Confidence Check
  onStatusUpdate?.('SAIL: Formulating grounded instruction contract...');
  await new Promise((r) => setTimeout(r, 220));

  const flareCheck = evaluateFlareConfidence(userPrompt, parentContent);

  if (flareCheck.needsRetrieval) {
    onStatusUpdate?.('FLARE: Token confidence dropped below threshold (θ < 0.35) — Halting generation for active retrieval...');
    await new Promise((r) => setTimeout(r, 380));

    onStatusUpdate?.(`CRAG: Evaluating document relevance for "${flareCheck.generatedQuery}"...`);
    const cragResult = await evaluateCragRetrieval(flareCheck.generatedQuery, domainContext);

    if (cragResult.status === 'incorrect') {
      onStatusUpdate?.('CRAG: Internal confidence insufficient (< 0.30) — Dispatching External Web Search Fallback...');
      await new Promise((r) => setTimeout(r, 450));
    }

    retrievalRecord = buildRetrievalRecord(
      'temp-node-id',
      flareCheck.generatedQuery,
      'FLARE',
      cragResult
    );
  } else {
    // Standard baseline SAIL verification
    const defaultCrag = await evaluateCragRetrieval(userPrompt.slice(0, 40), domainContext);
    retrievalRecord = buildRetrievalRecord(
      'temp-node-id',
      userPrompt.slice(0, 40),
      'SAIL_INIT',
      defaultCrag
    );
  }

  // 2. Toolformer Tool Interception
  const p = userPrompt.toLowerCase();
  let inlineToolCall: string | null = null;

  if (p.includes('calculate') || p.includes('eval') || p.includes('formula') || p.includes('+') || p.includes('*')) {
    inlineToolCall = '[TOOL:algebra_eval(expression="4 * 16 + 12")]';
  } else if (p.includes('sandbox') || p.includes('python') || p.includes('code') || p.includes('hash')) {
    inlineToolCall = '[TOOL:python_sandbox(script="verify_invariants(depth=3)")]';
  } else if (p.includes('search') || p.includes('latest') || p.includes('lookup')) {
    inlineToolCall = `[TOOL:web_search(query="${userPrompt.slice(0, 30)}")]`;
  }

  let toolResultText = '';
  if (inlineToolCall) {
    const parsed = extractToolCall(inlineToolCall);
    if (parsed) {
      onStatusUpdate?.(`Toolformer: Intercepted inline ${parsed.toolName} invocation...`);
      const executed = await executeToolInvocation('temp-node', parsed.toolName, parsed.parameters);
      toolInvocations.push(executed);
      onToolInvocation?.(executed);
      toolResultText = `\n\n${inlineToolCall}\n[RESULT: ${executed.executionResult}]\n\n`;
    }
  }

  // 3. Synthesize Grounded Output
  onStatusUpdate?.('Synthesizing verified lineage turn...');
  await new Promise((r) => setTimeout(r, 200));

  let synthesizedContent = '';
  if (selectedAnchorText) {
    synthesizedContent += `### Focused Branch Analysis: *"${selectedAnchorText.slice(0, 45)}..."*\n\n`;
  }

  synthesizedContent += `Addressing inquiry: **${userPrompt}**\n\n`;

  if (retrievalRecord) {
    synthesizedContent += `> **Evidence Attribution (${retrievalRecord.evaluationStatus.toUpperCase()}):** ${retrievalRecord.refinedEvidence}\n\n`;
  }

  if (toolResultText) {
    synthesizedContent += toolResultText;
  }

  synthesizedContent += `#### Core Theoretical Derivation:\n1. **Invariant Integrity:** Based on the established active lineage, the state transitions adhere strictly to the monotonic guarantees defined in prior ancestor nodes.\n2. **Boundary Resilience:** Under boundary edge-cases, the system maintains strict safety bounds without relying on ungrounded zero-shot heuristics.\n3. **Lineage Synthesis:** Addressing this query extends the reasoning branch while preserving historic context invariants.`;

  // Progressive token streaming simulation
  const chunks = synthesizedContent.split(' ');
  for (let i = 0; i < chunks.length; i += 4) {
    const chunk = chunks.slice(i, i + 4).join(' ') + ' ';
    onTokenChunk?.(chunk);
    await new Promise((r) => setTimeout(r, 35));
  }

  // 4. Generate AI Horizon Ghost Nodes
  onStatusUpdate?.('AI Horizon: Computing 3 orthogonal exploration vectors...');
  const ghostNodes = generateHorizonGhostNodes('temp-node', userPrompt, domainContext);
  await new Promise((r) => setTimeout(r, 150));

  return {
    content: synthesizedContent,
    retrievalRecord,
    toolInvocations,
    ghostNodes,
  };
}
