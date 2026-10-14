import { Schema, model, Types } from 'mongoose';

/* ---------- Map (workspace) ---------- */
const mapSchema = new Schema(
  {
    ownerId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 1000 },
    domain: { type: String, default: 'custom' },
    icon: { type: String, default: '🗺️' },
    isFavorite: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    activeNodeId: { type: String, default: null },
    viewport: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      zoom: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);
export const MapModel = model('Map', mapSchema);

/* ---------- Reasoning node (chat turn) ---------- */
const nodeSchema = new Schema(
  {
    mapId: { type: Types.ObjectId, ref: 'Map', required: true, index: true },
    parentId: { type: String, default: null, index: true },
    branchId: { type: String, required: true },
    branchName: { type: String, default: '' },
    depth: { type: Number, default: 0 },
    role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
    status: { type: String, default: 'completed' },
    rawContent: { type: String, required: true },
    tokenCount: { type: Number, default: 0 },
    selectionAnchor: { type: Schema.Types.Mixed, default: null },
    toolInvocations: { type: [Schema.Types.Mixed], default: [] },
    retrievalRecord: { type: Schema.Types.Mixed, default: null },
    ghostNodes: { type: [Schema.Types.Mixed], default: [] },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);
export const NodeModel = model('Node', nodeSchema);

/* ---------- Free canvas card (Obsidian JSON Canvas compatible) ---------- */
const cardSchema = new Schema(
  {
    _id: { type: String, required: true },
    mapId: { type: Types.ObjectId, ref: 'Map', required: true, index: true },
    type: { type: String, enum: ['text', 'link', 'group', 'file'], required: true },
    text: { type: String, default: '' },
    url: { type: String, default: '' },
    label: { type: String, default: '' },
    file: { type: String, default: '' },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 260 },
    height: { type: Number, default: 140 },
    color: { type: String, default: '' },
  },
  { timestamps: true }
);
export const CardModel = model('Card', cardSchema);

/* ---------- Manual edge between cards / nodes ---------- */
const edgeSchema = new Schema(
  {
    _id: { type: String, required: true },
    mapId: { type: Types.ObjectId, ref: 'Map', required: true, index: true },
    fromNode: { type: String, required: true },
    toNode: { type: String, required: true },
    fromSide: { type: String, default: 'right' },
    toSide: { type: String, default: 'left' },
    fromEnd: { type: String, default: 'none' },
    toEnd: { type: String, default: 'arrow' },
    label: { type: String, default: '' },
    color: { type: String, default: '' },
  },
  { timestamps: true }
);
export const EdgeModel = model('Edge', edgeSchema);

/* ---------- Cross-branch insight ---------- */
const insightSchema = new Schema(
  {
    mapId: { type: Types.ObjectId, ref: 'Map', required: true, index: true },
    sourceNodeId: { type: String, required: true },
    targetNodeId: { type: String, required: true },
    insightType: { type: String, enum: ['contradiction', 'synergy', 'analogy', 'dependency'], required: true },
    title: { type: String, required: true },
    analysis: { type: String, required: true },
    similarityScore: { type: Number, default: 0.85 },
  },
  { timestamps: true }
);
export const InsightModel = model('Insight', insightSchema);
