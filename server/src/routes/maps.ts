import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { MapModel, NodeModel, CardModel, EdgeModel, InsightModel } from '../models/index.js';
import { ah, validate, requireAuth, HttpError, type AuthedRequest } from '../middleware.js';
import {
  serializeMap, serializeNode, serializeInsight, loadFullMap, deleteMapCascade,
} from '../services/mapService.js';
import { runAutonomousReasoningPipeline } from '../reasoning/reasoningPipeline.js';
import { scanForCrossBranchInsights } from '../reasoning/insightAnalyzer.js';
import { toJsonCanvas, fromJsonCanvas } from '../services/jsonCanvas.js';

const router = Router();
router.use(requireAuth);

/** Ensure the map exists and belongs to the current user. */
async function ownedMap(req: AuthedRequest, mapId: string) {
  if (!Types.ObjectId.isValid(mapId)) throw new HttpError(404, 'NOT_FOUND');
  const map = await MapModel.findOne({ _id: mapId, ownerId: req.userId });
  if (!map) throw new HttpError(404, 'NOT_FOUND');
  return map;
}

/* ---------------- Maps CRUD ---------------- */

router.get(
  '/',
  ah(async (req: AuthedRequest, res) => {
    const filter = String(req.query.filter || 'all');
    const q: Record<string, unknown> = { ownerId: req.userId };
    if (filter === 'trash') q.deletedAt = { $ne: null };
    else q.deletedAt = null;
    if (filter === 'favorites') q.isFavorite = true;

    const maps = await MapModel.find(q).sort({ updatedAt: -1 }).lean();
    const counts = await NodeModel.aggregate([
      { $match: { mapId: { $in: maps.map((m) => m._id) } } },
      { $group: { _id: '$mapId', n: { $sum: 1 } } },
    ]);
    const cardCounts = await CardModel.aggregate([
      { $match: { mapId: { $in: maps.map((m) => m._id) } } },
      { $group: { _id: '$mapId', n: { $sum: 1 } } },
    ]);
    const cMap = new Map(counts.map((c) => [c._id.toString(), c.n]));
    const kMap = new Map(cardCounts.map((c) => [c._id.toString(), c.n]));
    res.json({
      maps: maps.map((m) => ({
        ...serializeMap(m),
        nodeCount: cMap.get(m._id.toString()) ?? 0,
        cardCount: kMap.get(m._id.toString()) ?? 0,
      })),
    });
  })
);

router.get(
  '/stats',
  ah(async (req: AuthedRequest, res) => {
    const [all, favorites, trash] = await Promise.all([
      MapModel.countDocuments({ ownerId: req.userId, deletedAt: null }),
      MapModel.countDocuments({ ownerId: req.userId, deletedAt: null, isFavorite: true }),
      MapModel.countDocuments({ ownerId: req.userId, deletedAt: { $ne: null } }),
    ]);
    res.json({ all, favorites, trash });
  })
);

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional(),
  icon: z.string().max(8).optional(),
  firstPrompt: z.string().trim().max(4000).optional(),
});

router.post(
  '/',
  validate(createSchema),
  ah(async (req: AuthedRequest, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const map = await MapModel.create({
      ownerId: req.userId,
      title: body.title,
      description: body.description ?? '',
      icon: body.icon ?? '🗺️',
    });
    if (body.firstPrompt) {
      const root = await NodeModel.create({
        mapId: map._id,
        parentId: null,
        branchId: 'branch-main',
        branchName: 'Main',
        depth: 0,
        role: 'user',
        rawContent: body.firstPrompt,
        tokenCount: Math.ceil(body.firstPrompt.length / 4),
        position: { x: 0, y: 0 },
      });
      map.activeNodeId = root._id.toString();
      await map.save();
    }
    res.status(201).json({ map: await loadFullMap(map._id) });
  })
);

router.get(
  '/:id',
  ah(async (req: AuthedRequest, res) => {
    const map = await ownedMap(req, req.params.id);
    res.json({ map: await loadFullMap(map._id) });
  })
);

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  icon: z.string().max(8).optional(),
  isFavorite: z.boolean().optional(),
  activeNodeId: z.string().nullable().optional(),
  viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }).optional(),
});

router.patch(
  '/:id',
  validate(updateSchema),
  ah(async (req: AuthedRequest, res) => {
    const map = await ownedMap(req, req.params.id);
    Object.assign(map, req.body);
    await map.save();
    res.json({ map: serializeMap(map) });
  })
);

/** DELETE → soft delete (trash). DELETE ?permanent=1 → cascade delete. */
router.delete(
  '/:id',
  ah(async (req: AuthedRequest, res) => {
    const map = await ownedMap(req, req.params.id);
    if (req.query.permanent === '1' || map.deletedAt) {
      await deleteMapCascade(map._id);
      return res.json({ ok: true, permanent: true });
    }
    map.deletedAt = new Date();
    await map.save();
    res.json({ ok: true, permanent: false });
  })
);

router.post(
  '/:id/restore',
  ah(async (req: AuthedRequest, res) => {
    const map = await ownedMap(req, req.params.id);
    map.deletedAt = null;
    await map.save();
    res.json({ map: serializeMap(map) });
  })
);

router.post(
  '/:id/duplicate',
  ah(async (req: AuthedRequest, res) => {
    const src = await ownedMap(req, req.params.id);
    const copy = await MapModel.create({
      ownerId: req.userId,
      title: `${src.title} (copy)`,
      description: src.description,
      domain: src.domain,
      icon: src.icon,
      viewport: src.viewport,
    });

    const nodes = await NodeModel.find({ mapId: src._id }).lean();
    const idMap = new Map(nodes.map((n) => [n._id.toString(), new Types.ObjectId().toString()]));
    if (nodes.length) {
      await NodeModel.insertMany(
        nodes.map(({ _id, createdAt, updatedAt, ...n }: any) => ({
          ...n,
          _id: idMap.get(_id.toString()),
          mapId: copy._id,
          parentId: n.parentId ? idMap.get(n.parentId) ?? null : null,
        }))
      );
    }
    const suffix = '-' + Math.random().toString(36).slice(2, 6);
    const cards = await CardModel.find({ mapId: src._id }).lean();
    if (cards.length) {
      await CardModel.insertMany(
        cards.map(({ createdAt, updatedAt, ...c }: any) => ({ ...c, _id: c._id + suffix, mapId: copy._id }))
      );
    }
    const remap = (id: string) => idMap.get(id) ?? (cards.some((c) => c._id === id) ? id + suffix : id);
    const edges = await EdgeModel.find({ mapId: src._id }).lean();
    if (edges.length) {
      await EdgeModel.insertMany(
        edges.map(({ createdAt, updatedAt, ...e }: any) => ({
          ...e,
          _id: e._id + suffix,
          mapId: copy._id,
          fromNode: remap(e.fromNode),
          toNode: remap(e.toNode),
        }))
      );
    }
    const insights = await InsightModel.find({ mapId: src._id }).lean();
    if (insights.length) {
      await InsightModel.insertMany(
        insights.map(({ _id, createdAt, updatedAt, ...i }: any) => ({
          ...i,
          mapId: copy._id,
          sourceNodeId: remap(i.sourceNodeId),
          targetNodeId: remap(i.targetNodeId),
        }))
      );
    }
    copy.activeNodeId = src.activeNodeId ? idMap.get(src.activeNodeId) ?? null : null;
    await copy.save();
    res.status(201).json({ map: serializeMap(copy) });
  })
);

/* ---------------- Reasoning: fork / extend ---------------- */

const forkSchema = z.object({
  parentNodeId: z.string().nullable(),
  prompt: z.string().trim().min(1).max(4000),
  anchor: z
    .object({
      parentNodeId: z.string(),
      selectedText: z.string().max(2000),
      startOffset: z.number(),
      endOffset: z.number(),
      contextSnippet: z.object({ prefix: z.string(), suffix: z.string() }).optional(),
    })
    .optional(),
  ghostId: z.string().optional(),
});

router.post(
  '/:id/fork',
  validate(forkSchema),
  ah(async (req: AuthedRequest, res) => {
    const map = await ownedMap(req, req.params.id);
    const { parentNodeId, prompt, anchor, ghostId } = req.body as z.infer<typeof forkSchema>;

    const parent = parentNodeId ? await NodeModel.findOne({ _id: parentNodeId, mapId: map._id }) : null;
    if (parentNodeId && !parent) throw new HttpError(404, 'PARENT_NOT_FOUND');

    // Mark ghost as materialized on the parent
    if (parent && ghostId) {
      parent.ghostNodes = (parent.ghostNodes as any[]).map((g) =>
        g.id === ghostId ? { ...g, isMaterialized: true } : g
      );
      parent.markModified('ghostNodes');
      await parent.save();
    }

    // Starting a new branch when the parent already has children; continuing otherwise
    const siblingCount = parent ? await NodeModel.countDocuments({ mapId: map._id, parentId: parent._id.toString() }) : 0;
    const isNewBranch = !parent || siblingCount > 0 || !!anchor;
    const branchId = isNewBranch ? `branch-${Date.now().toString(36)}` : parent!.branchId;
    const branchName = isNewBranch
      ? anchor
        ? `↳ ${anchor.selectedText.slice(0, 28)}…`
        : prompt.slice(0, 32)
      : parent!.branchName;

    const baseX = parent?.position?.x ?? 0;
    const baseY = parent?.position?.y ?? 0;

    const userNode = await NodeModel.create({
      mapId: map._id,
      parentId: parent ? parent._id.toString() : null,
      branchId,
      branchName,
      depth: parent ? parent.depth + 1 : 0,
      role: 'user',
      rawContent: prompt,
      tokenCount: Math.ceil(prompt.length / 4),
      selectionAnchor: anchor ?? null,
      position: { x: baseX + 400, y: baseY + siblingCount * 260 },
    });

    const result = await runAutonomousReasoningPipeline({
      userPrompt: prompt,
      parentContent: parent?.rawContent ?? '',
      selectedAnchorText: anchor?.selectedText,
      domainContext: map.domain,
    });

    const assistantId = new Types.ObjectId();
    const assistantNode = await NodeModel.create({
      _id: assistantId,
      mapId: map._id,
      parentId: userNode._id.toString(),
      branchId,
      branchName,
      depth: userNode.depth + 1,
      role: 'assistant',
      rawContent: result.content,
      tokenCount: Math.ceil(result.content.length / 4),
      toolInvocations: result.toolInvocations.map((t) => ({ ...t, nodeId: assistantId.toString() })),
      retrievalRecord: result.retrievalRecord ? { ...result.retrievalRecord, nodeId: assistantId.toString() } : null,
      ghostNodes: result.ghostNodes.map((g) => ({ ...g, parentNodeId: assistantId.toString() })),
      position: { x: userNode.position!.x + 400, y: userNode.position!.y },
    });

    // Cross-branch insight scan
    const allNodes = (await NodeModel.find({ mapId: map._id }).lean()).map(serializeNode);
    const nodeRecord = Object.fromEntries(allNodes.map((n) => [n.id, n])) as any;
    const existing = (await InsightModel.find({ mapId: map._id }).lean()).map(serializeInsight) as any;
    const found = scanForCrossBranchInsights(nodeRecord[assistantId.toString()], nodeRecord, existing);
    const created = found.length
      ? await InsightModel.insertMany(
          found.map((f) => ({
            mapId: map._id,
            sourceNodeId: f.sourceNodeId,
            targetNodeId: f.targetNodeId,
            insightType: f.insightType,
            title: f.title,
            analysis: f.analysis,
            similarityScore: f.similarityScore,
          }))
        )
      : [];

    map.activeNodeId = assistantId.toString();
    await map.save();

    res.status(201).json({
      nodes: [serializeNode(userNode), serializeNode(assistantNode)],
      insights: created.map(serializeInsight),
      parent: parent ? serializeNode(parent) : null,
      activeNodeId: map.activeNodeId,
    });
  })
);

/* ---------------- Nodes ---------------- */

const nodeUpdateSchema = z.object({
  rawContent: z.string().min(1).max(20000).optional(),
  branchName: z.string().max(120).optional(),
});

router.patch(
  '/:id/nodes/:nodeId',
  validate(nodeUpdateSchema),
  ah(async (req: AuthedRequest, res) => {
    const map = await ownedMap(req, req.params.id);
    const node = await NodeModel.findOne({ _id: req.params.nodeId, mapId: map._id });
    if (!node) throw new HttpError(404, 'NOT_FOUND');
    if (req.body.rawContent !== undefined) {
      node.rawContent = req.body.rawContent;
      node.tokenCount = Math.ceil(req.body.rawContent.length / 4);
    }
    if (req.body.branchName !== undefined) node.branchName = req.body.branchName;
    await node.save();
    res.json({ node: serializeNode(node) });
  })
);

/** Deletes the node and its entire subtree. */
router.delete(
  '/:id/nodes/:nodeId',
  ah(async (req: AuthedRequest, res) => {
    const map = await ownedMap(req, req.params.id);
    const target = await NodeModel.findOne({ _id: req.params.nodeId, mapId: map._id }).lean();
    if (!target) throw new HttpError(404, 'NOT_FOUND');

    const all = await NodeModel.find({ mapId: map._id }).select('_id parentId').lean();
    const children = new Map<string, string[]>();
    for (const n of all) {
      if (!n.parentId) continue;
      children.set(n.parentId, [...(children.get(n.parentId) ?? []), n._id.toString()]);
    }
    const toDelete: string[] = [];
    const stack = [target._id.toString()];
    while (stack.length) {
      const id = stack.pop()!;
      toDelete.push(id);
      stack.push(...(children.get(id) ?? []));
    }

    await NodeModel.deleteMany({ _id: { $in: toDelete } });
    await InsightModel.deleteMany({
      mapId: map._id,
      $or: [{ sourceNodeId: { $in: toDelete } }, { targetNodeId: { $in: toDelete } }],
    });
    await EdgeModel.deleteMany({
      mapId: map._id,
      $or: [{ fromNode: { $in: toDelete } }, { toNode: { $in: toDelete } }],
    });

    if (map.activeNodeId && toDelete.includes(map.activeNodeId)) {
      map.activeNodeId = target.parentId ?? null;
      await map.save();
    }
    res.json({ deleted: toDelete, activeNodeId: map.activeNodeId });
  })
);

/* ---------------- Canvas (cards / edges / positions) ---------------- */

const cardSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(['text', 'link', 'group', 'file']),
  text: z.string().max(20000).optional().default(''),
  url: z.string().max(2000).optional().default(''),
  label: z.string().max(200).optional().default(''),
  file: z.string().max(500).optional().default(''),
  x: z.number(),
  y: z.number(),
  width: z.number().min(40).max(10000),
  height: z.number().min(30).max(10000),
  color: z.string().max(16).optional().default(''),
});

const edgeSchema = z.object({
  id: z.string().min(1).max(64),
  fromNode: z.string(),
  toNode: z.string(),
  fromSide: z.string().optional().default('right'),
  toSide: z.string().optional().default('left'),
  fromEnd: z.string().optional().default('none'),
  toEnd: z.string().optional().default('arrow'),
  label: z.string().max(200).optional().default(''),
  color: z.string().max(16).optional().default(''),
});

const canvasSchema = z.object({
  cards: z.array(cardSchema).max(2000),
  edges: z.array(edgeSchema).max(4000),
  nodePositions: z.array(z.object({ id: z.string(), x: z.number(), y: z.number() })).max(4000).optional(),
  viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }).optional(),
});

router.put(
  '/:id/canvas',
  validate(canvasSchema),
  ah(async (req: AuthedRequest, res) => {
    const map = await ownedMap(req, req.params.id);
    const { cards, edges, nodePositions, viewport } = req.body as z.infer<typeof canvasSchema>;

    await CardModel.deleteMany({ mapId: map._id });
    if (cards.length) {
      await CardModel.insertMany(cards.map(({ id, ...c }) => ({ ...c, _id: id, mapId: map._id })));
    }
    await EdgeModel.deleteMany({ mapId: map._id });
    if (edges.length) {
      await EdgeModel.insertMany(edges.map(({ id, ...e }) => ({ ...e, _id: id, mapId: map._id })));
    }
    if (nodePositions?.length) {
      await NodeModel.bulkWrite(
        nodePositions
          .filter((p) => Types.ObjectId.isValid(p.id))
          .map((p) => ({
            updateOne: { filter: { _id: p.id, mapId: map._id }, update: { $set: { position: { x: p.x, y: p.y } } } },
          }))
      );
    }
    if (viewport) map.viewport = viewport;
    map.updatedAt = new Date();
    await map.save();
    res.json({ ok: true, savedAt: new Date().toISOString() });
  })
);

/* ---------------- JSON Canvas export / import ---------------- */

router.get(
  '/:id/export',
  ah(async (req: AuthedRequest, res) => {
    const map = await ownedMap(req, req.params.id);
    const full = await loadFullMap(map._id);
    const canvas = toJsonCanvas(full!);
    const filename = `${map.title.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 60) || 'map'}.canvas`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(JSON.stringify(canvas, null, 2));
  })
);

const importSchema = z.object({
  title: z.string().trim().min(1).max(200),
  canvas: z.object({
    nodes: z.array(z.record(z.string(), z.any())).optional().default([]),
    edges: z.array(z.record(z.string(), z.any())).optional().default([]),
  }),
});

router.post(
  '/import',
  validate(importSchema),
  ah(async (req: AuthedRequest, res) => {
    const { title, canvas } = req.body as z.infer<typeof importSchema>;
    const map = await MapModel.create({ ownerId: req.userId, title, icon: '📥' });
    const { cards, edges } = fromJsonCanvas(canvas);
    if (cards.length) await CardModel.insertMany(cards.map(({ id, ...c }) => ({ ...c, _id: id, mapId: map._id })));
    if (edges.length) await EdgeModel.insertMany(edges.map(({ id, ...e }) => ({ ...e, _id: id, mapId: map._id })));
    res.status(201).json({ map: serializeMap(map) });
  })
);

export default router;
