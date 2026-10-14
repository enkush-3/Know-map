export interface FlareCheckResult {
  needsRetrieval: boolean;
  uncertainSpan?: string;
  generatedQuery: string;
}

export function evaluateFlareConfidence(
  prompt: string,
  _parentContent?: string
): FlareCheckResult {
  const p = prompt.toLowerCase();
  
  // Triggers FLARE if prompt touches numerical constants, specific benchmarks, statutory codes, or obscure details
  const triggersUncertainty = 
    p.includes('how many') ||
    p.includes('formula') ||
    p.includes('calculate') ||
    p.includes('latency') ||
    p.includes('specific') ||
    p.includes('benchmark') ||
    p.includes('recent') ||
    p.includes('drift') ||
    p.includes('kinetics') ||
    p.includes('statute');

  const cleanQuery = prompt.replace(/[^\w\s]/gi, '').trim().slice(0, 60);

  return {
    needsRetrieval: triggersUncertainty,
    uncertainSpan: triggersUncertainty ? prompt : undefined,
    generatedQuery: cleanQuery || 'domain specification query',
  };
}
