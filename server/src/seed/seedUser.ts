import { Types } from 'mongoose';
import { MapModel, NodeModel, CardModel, EdgeModel, InsightModel } from '../models/index.js';
import { SEED_WORKSPACES } from './seedWorkspaces.js';

const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Copies the bundled demo workspaces (with fresh ids) into a new user's account. */
export async function seedMapsForUser(ownerId: Types.ObjectId) {
  // 1. Mongolian free-canvas welcome map (Obsidian style)
  await seedWelcomeCanvas(ownerId);

  // 2. Reasoning demo maps
  for (const ws of Object.values(SEED_WORKSPACES)) {
    const map = await MapModel.create({
      ownerId,
      title: ws.title,
      description: ws.description,
      domain: ws.domainContext,
      icon: ws.domainContext === 'genomics' ? '🧬' : ws.domainContext === 'jurisprudence' ? '⚖️' : '🖧',
      viewport: ws.viewport,
    });

    // Map old string ids → new ObjectIds so parent references remain valid
    const idMap = new Map<string, string>();
    for (const oldId of Object.keys(ws.nodes)) idMap.set(oldId, new Types.ObjectId().toString());

    const docs = Object.values(ws.nodes).map((n) => ({
      _id: idMap.get(n.id),
      mapId: map._id,
      parentId: n.parentId ? idMap.get(n.parentId) ?? null : null,
      branchId: n.branchId,
      branchName: n.branchName ?? '',
      depth: n.depth,
      role: n.role,
      status: n.status,
      rawContent: n.rawContent,
      tokenCount: n.tokenCount,
      selectionAnchor: n.selectionAnchor
        ? { ...n.selectionAnchor, parentNodeId: idMap.get(n.selectionAnchor.parentNodeId) }
        : null,
      toolInvocations: n.toolInvocations ?? [],
      retrievalRecord: n.retrievalRecord ?? null,
      ghostNodes: (n.ghostNodes ?? []).map((g) => ({ ...g, id: `ghost-${rid()}`, parentNodeId: idMap.get(n.id) })),
      position: n.position,
    }));
    await NodeModel.insertMany(docs);

    if (ws.insightEdges.length) {
      await InsightModel.insertMany(
        ws.insightEdges.map((e) => ({
          mapId: map._id,
          sourceNodeId: idMap.get(e.sourceNodeId),
          targetNodeId: idMap.get(e.targetNodeId),
          insightType: e.insightType,
          title: e.title,
          analysis: e.analysis,
          similarityScore: e.similarityScore,
        }))
      );
    }

    map.activeNodeId = idMap.get(ws.activeNodeId) ?? null;
    await map.save();
  }
}

async function seedWelcomeCanvas(ownerId: Types.ObjectId) {
  const map = await MapModel.create({
    ownerId,
    title: 'Know map-д тавтай морил 👋',
    description: 'Obsidian Canvas шиг чөлөөт карт, холбоос, бүлгүүдтэй жишээ самбар.',
    domain: 'custom',
    icon: '✨',
    isFavorite: true,
    viewport: { x: 80, y: 60, zoom: 0.85 },
  });

  const ids = { g: rid(), a: rid(), b: rid(), c: rid(), d: rid(), e: rid(), f: rid() };

  await CardModel.insertMany([
    { _id: ids.g, mapId: map._id, type: 'group', label: 'Эхлэх заавар', x: -20, y: -60, width: 940, height: 380, color: '5' },
    {
      _id: ids.a, mapId: map._id, type: 'text', x: 20, y: 0, width: 260, height: 150, color: '6',
      text: '# Сайн байна уу!\n\nЭнэ бол **Know map** — таны мэдлэгийн газрын зураг.',
    },
    {
      _id: ids.b, mapId: map._id, type: 'text', x: 340, y: 0, width: 260, height: 150, color: '4',
      text: '## Карт нэмэх\n\nХоосон газар **давхар товш** эсвэл доод toolbar-аас сонго.',
    },
    {
      _id: ids.c, mapId: map._id, type: 'text', x: 660, y: 0, width: 240, height: 150, color: '3',
      text: '## Холбох\n\nКартын ирмэг дээрх цэгээс чирээд өөр карт руу тавь.',
    },
    {
      _id: ids.d, mapId: map._id, type: 'text', x: 340, y: 190, width: 260, height: 110, color: '2',
      text: '**Засах:** давхар товш\n**Устгах:** Delete\n**Хуулах:** Ctrl + D',
    },
    {
      _id: ids.e, mapId: map._id, type: 'link', x: 20, y: 190, width: 260, height: 110,
      url: 'https://jsoncanvas.org',
    },
    {
      _id: ids.f, mapId: map._id, type: 'text', x: 660, y: 190, width: 240, height: 110, color: '1',
      text: '💡 `.canvas` файлаар export хийгээд **Obsidian**-д нээж болно.',
    },
  ]);

  await EdgeModel.insertMany([
    { _id: rid(), mapId: map._id, fromNode: ids.a, toNode: ids.b, fromSide: 'right', toSide: 'left', label: 'дараа нь' },
    { _id: rid(), mapId: map._id, fromNode: ids.b, toNode: ids.c, fromSide: 'right', toSide: 'left' },
    { _id: rid(), mapId: map._id, fromNode: ids.b, toNode: ids.d, fromSide: 'bottom', toSide: 'top', color: '4' },
    { _id: rid(), mapId: map._id, fromNode: ids.c, toNode: ids.f, fromSide: 'bottom', toSide: 'top', color: '3' },
  ]);
}
