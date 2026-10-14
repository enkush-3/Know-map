import { KnowNode, InsightEdgeData, InsightType } from '../types';

export function scanForCrossBranchInsights(
  newNode: KnowNode,
  allNodes: Record<string, KnowNode>,
  existingInsights: InsightEdgeData[]
): InsightEdgeData[] {
  const newInsights: InsightEdgeData[] = [];
  const newContent = newNode.rawContent.toLowerCase();

  // Find non-lineage nodes
  const lineageAncestorIds = new Set<string>();
  let curr: KnowNode | undefined = newNode;
  while (curr) {
    lineageAncestorIds.add(curr.id);
    if (!curr.parentId) break;
    curr = allNodes[curr.parentId];
  }

  const existingPairs = new Set(
    existingInsights.map((e) => `${e.sourceNodeId}->${e.targetNodeId}`)
  );

  for (const candidate of Object.values(allNodes)) {
    if (candidate.id === newNode.id || lineageAncestorIds.has(candidate.id)) {
      continue;
    }

    const candContent = candidate.rawContent.toLowerCase();

    // Check for interesting semantic patterns
    let detectedType: InsightType | null = null;
    let title = '';
    let analysis = '';
    let score = 0.84;

    const hasContradictionWords =
      (newContent.includes('pessimistic') && candContent.includes('optimistic')) ||
      (newContent.includes('optimistic') && candContent.includes('pessimistic')) ||
      (newContent.includes('leaderless') && candContent.includes('leader lease')) ||
      (newContent.includes('absolute') && candContent.includes('qualified')) ||
      (newContent.includes('off-target') && candContent.includes('high-fidelity'));

    const hasSynergyWords =
      (newContent.includes('truetime') && candContent.includes('linearizab')) ||
      (newContent.includes('epigenetic') && candContent.includes('pam')) ||
      (newContent.includes('wal') && candContent.includes('fsync'));

    if (hasContradictionWords) {
      detectedType = 'contradiction';
      title = 'Incompatible Concurrency / Operational Assumptions';
      analysis = `Direct operational divergence detected: one branch relies on optimistic forward progress while the other enforces strict pessimistic isolation or lock holding.`;
      score = 0.89;
    } else if (hasSynergyWords) {
      detectedType = 'synergy';
      title = 'Harmonious Cross-Domain Mechanism';
      analysis = `Synergistic alignment: principles established in this branch reinforce the safety invariants demonstrated in the parallel branch.`;
      score = 0.87;
    }

    if (detectedType) {
      const pairKey1 = `${newNode.id}->${candidate.id}`;
      const pairKey2 = `${candidate.id}->${newNode.id}`;

      if (!existingPairs.has(pairKey1) && !existingPairs.has(pairKey2)) {
        newInsights.push({
          id: `insight-${Date.now()}-${newInsights.length}`,
          workspaceId: newNode.workspaceId,
          sourceNodeId: candidate.id,
          targetNodeId: newNode.id,
          insightType: detectedType,
          title,
          analysis,
          similarityScore: score,
        });
        existingPairs.add(pairKey1);
      }
    }
  }

  return newInsights;
}
