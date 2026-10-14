import dagre from 'dagre';
import { KnowNode } from '../types';

export function calculateDagreLayout(
  nodes: Record<string, KnowNode>,
  nodeWidth = 340,
  nodeHeight = 220
): Record<string, KnowNode> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'LR',
    nodesep: 90,
    ranksep: 160,
    marginx: 60,
    marginy: 60,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to dagre graph
  Object.values(nodes).forEach((node) => {
    // Determine dynamic height based on content
    const estimatedHeight = Math.min(360, Math.max(nodeHeight, Math.floor(node.rawContent.length / 3) + 120));
    g.setNode(node.id, { width: nodeWidth, height: estimatedHeight });
  });

  // Add edges
  Object.values(nodes).forEach((node) => {
    if (node.parentId && nodes[node.parentId]) {
      g.setEdge(node.parentId, node.id);
    }
  });

  // Execute Dagre layout
  dagre.layout(g);

  const updatedNodes: Record<string, KnowNode> = {};

  Object.values(nodes).forEach((node) => {
    const layoutNode = g.node(node.id);
    const newPos = layoutNode
      ? {
          x: Math.round(layoutNode.x - layoutNode.width / 2),
          y: Math.round(layoutNode.y - layoutNode.height / 2),
        }
      : node.position;

    // Reposition attached ghost nodes to the right
    const updatedGhostNodes = node.ghostNodes?.map((ghost, idx) => ({
      ...ghost,
      position: {
        x: newPos.x + nodeWidth + 50,
        y: newPos.y + idx * 110 - (node.ghostNodes?.length || 1) * 20,
      },
    }));

    updatedNodes[node.id] = {
      ...node,
      position: newPos,
      ghostNodes: updatedGhostNodes,
    };
  });

  return updatedNodes;
}
