import { Types } from 'mongoose';
import { MapModel, NodeModel, CardModel, EdgeModel, InsightModel } from '../models/index.js';

/** Convert mongoose docs into plain client-facing objects (id instead of _id). */
export function serializeMap(m: any) {
  return {
    id: m._id.toString(),
    title: m.title,
    description: m.description,
    domain: m.domain,
    icon: m.icon,
    isFavorite: m.isFavorite,
    deletedAt: m.deletedAt,
    activeNodeId: m.activeNodeId,
    viewport: m.viewport,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

export function serializeNode(n: any) {
  return {
    id: n._id.toString(),
    mapId: n.mapId.toString(),
    parentId: n.parentId,
    branchId: n.branchId,
    branchName: n.branchName,
    depth: n.depth,
    role: n.role,
    status: n.status,
    rawContent: n.rawContent,
    tokenCount: n.tokenCount,
    selectionAnchor: n.selectionAnchor ?? undefined,
    toolInvocations: n.toolInvocations ?? [],
    retrievalRecord: n.retrievalRecord ?? undefined,
    ghostNodes: n.ghostNodes ?? [],
    position: n.position,
    createdAt: n.createdAt,
  };
}

export function serializeCard(c: any) {
  return {
    id: c._id,
    type: c.type,
    text: c.text,
    url: c.url,
    label: c.label,
    file: c.file,
    x: c.x,
    y: c.y,
    width: c.width,
    height: c.height,
    color: c.color,
  };
}

export function serializeEdge(e: any) {
  return {
    id: e._id,
    fromNode: e.fromNode,
    toNode: e.toNode,
    fromSide: e.fromSide,
    toSide: e.toSide,
    fromEnd: e.fromEnd,
    toEnd: e.toEnd,
    label: e.label,
    color: e.color,
  };
}

export function serializeInsight(i: any) {
  return {
    id: i._id.toString(),
    sourceNodeId: i.sourceNodeId,
    targetNodeId: i.targetNodeId,
    insightType: i.insightType,
    title: i.title,
    analysis: i.analysis,
    similarityScore: i.similarityScore,
  };
}

/** Load a full map with all its children. */
export async function loadFullMap(mapId: string | Types.ObjectId) {
  const [map, nodes, cards, edges, insights] = await Promise.all([
    MapModel.findById(mapId).lean(),
    NodeModel.find({ mapId }).sort({ depth: 1, createdAt: 1 }).lean(),
    CardModel.find({ mapId }).lean(),
    EdgeModel.find({ mapId }).lean(),
    InsightModel.find({ mapId }).lean(),
  ]);
  if (!map) return null;
  return {
    ...serializeMap(map),
    nodes: nodes.map(serializeNode),
    cards: cards.map(serializeCard),
    edges: edges.map(serializeEdge),
    insights: insights.map(serializeInsight),
  };
}

export async function deleteMapCascade(mapId: Types.ObjectId | string) {
  await Promise.all([
    NodeModel.deleteMany({ mapId }),
    CardModel.deleteMany({ mapId }),
    EdgeModel.deleteMany({ mapId }),
    InsightModel.deleteMany({ mapId }),
  ]);
  await MapModel.deleteOne({ _id: mapId });
}
