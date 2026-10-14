import type { RetrievalRecord, CragEvalStatus } from './types';

export interface CragEvaluationResult {
  status: CragEvalStatus;
  score: number;
  refinedEvidence: string;
  fallbackQuery?: string;
}

export async function evaluateCragRetrieval(
  query: string,
  domain: string
): Promise<CragEvaluationResult> {
  // Simulate CRAG evaluator processing delay
  await new Promise((r) => setTimeout(r, 380));

  const lowerQuery = query.toLowerCase();

  // If query asks about uncertain or highly recent/obscure facts, simulate ambiguity or fallback
  if (lowerQuery.includes('fallback') || lowerQuery.includes('recent') || lowerQuery.includes('obscure') || lowerQuery.includes('circuit')) {
    return {
      status: 'incorrect',
      score: 0.24,
      fallbackQuery: `external web search: ${query}`,
      refinedEvidence: `[External Web Fallback Triggered]: Retrieved fresh web citations and real-time filings addressing "${query}" after internal corpus relevance scored < 0.30.`,
    };
  }

  if (lowerQuery.includes('partial') || lowerQuery.includes('ambiguous') || lowerQuery.includes('trade-off')) {
    return {
      status: 'ambiguous',
      score: 0.58,
      fallbackQuery: `supplementary verification: ${query}`,
      refinedEvidence: `[CRAG Dual-Channel Fusion]: Internal corpus confirmed baseline mechanics (${domain}); external web indexed citations verified contemporary engineering practices.`,
    };
  }

  // Default high-relevance correct evaluation
  return {
    status: 'correct',
    score: 0.92,
    refinedEvidence: `[CRAG Verified Core Evidence]: Direct match with peer-reviewed literature and foundational specifications for ${domain}. Semantic noise stripped.`,
  };
}

export function buildRetrievalRecord(
  nodeId: string,
  query: string,
  trigger: 'FLARE' | 'SAIL_INIT' | 'USER_EXPLICIT',
  evalResult: CragEvaluationResult
): RetrievalRecord {
  return {
    id: `ret-${Date.now()}`,
    nodeId,
    queryText: query,
    retrievalTrigger: trigger,
    rawPassages: [
      `Primary specification passage for: ${query}`,
      `Technical report & benchmark verification data`,
    ],
    evaluationStatus: evalResult.status,
    evaluationScore: evalResult.score,
    refinedEvidence: evalResult.refinedEvidence,
    fallbackSearchQuery: evalResult.fallbackQuery,
    createdAt: new Date().toISOString(),
  };
}
