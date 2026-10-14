/**
 * JSON Canvas 1.0 (https://jsoncanvas.org) — the open format used by Obsidian Canvas.
 */
type AnyRec = Record<string, any>;

const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function toJsonCanvas(full: AnyRec) {
  const nodes: AnyRec[] = [];
  const edges: AnyRec[] = [];

  for (const c of full.cards ?? []) {
    const base: AnyRec = {
      id: c.id,
      type: c.type,
      x: Math.round(c.x),
      y: Math.round(c.y),
      width: Math.round(c.width),
      height: Math.round(c.height),
    };
    if (c.color) base.color = c.color;
    if (c.type === 'text') base.text = c.text;
    if (c.type === 'link') base.url = c.url;
    if (c.type === 'file') base.file = c.file;
    if (c.type === 'group' && c.label) base.label = c.label;
    nodes.push(base);
  }

  // Reasoning nodes become text cards; lineage becomes edges
  for (const n of full.nodes ?? []) {
    const prefix = n.role === 'user' ? '**❓ ' : '';
    const suffix = n.role === 'user' ? '**' : '';
    nodes.push({
      id: n.id,
      type: 'text',
      x: Math.round(n.position?.x ?? 0),
      y: Math.round(n.position?.y ?? 0),
      width: 340,
      height: n.role === 'user' ? 140 : 320,
      color: n.role === 'user' ? '5' : '6',
      text: `${prefix}${n.rawContent}${suffix}`,
    });
    if (n.parentId) {
      edges.push({
        id: `lin-${n.id}`,
        fromNode: n.parentId,
        fromSide: 'right',
        toNode: n.id,
        toSide: 'left',
        toEnd: 'arrow',
      });
    }
  }

  for (const e of full.edges ?? []) {
    const out: AnyRec = {
      id: e.id,
      fromNode: e.fromNode,
      toNode: e.toNode,
      fromSide: e.fromSide,
      toSide: e.toSide,
    };
    if (e.fromEnd && e.fromEnd !== 'none') out.fromEnd = e.fromEnd;
    if (e.toEnd && e.toEnd !== 'arrow') out.toEnd = e.toEnd;
    if (e.label) out.label = e.label;
    if (e.color) out.color = e.color;
    edges.push(out);
  }

  for (const i of full.insights ?? []) {
    edges.push({
      id: `ins-${i.id}`,
      fromNode: i.sourceNodeId,
      toNode: i.targetNodeId,
      fromSide: 'bottom',
      toSide: 'top',
      label: `${i.insightType}: ${i.title}`,
      color: i.insightType === 'contradiction' ? '2' : '6',
    });
  }

  return { nodes, edges };
}

export function fromJsonCanvas(canvas: { nodes: AnyRec[]; edges: AnyRec[] }) {
  const known = new Set<string>();
  const cards = canvas.nodes
    .filter((n) => ['text', 'link', 'group', 'file'].includes(n.type))
    .map((n) => {
      const id = String(n.id || rid()).slice(0, 64);
      known.add(id);
      return {
        id,
        type: n.type as 'text' | 'link' | 'group' | 'file',
        text: String(n.text ?? ''),
        url: String(n.url ?? ''),
        label: String(n.label ?? ''),
        file: String(n.file ?? ''),
        x: Number(n.x) || 0,
        y: Number(n.y) || 0,
        width: Math.max(40, Number(n.width) || 260),
        height: Math.max(30, Number(n.height) || 140),
        color: n.color ? String(n.color) : '',
      };
    });

  const edges = canvas.edges
    .filter((e) => known.has(String(e.fromNode)) && known.has(String(e.toNode)))
    .map((e) => ({
      id: String(e.id || rid()).slice(0, 64),
      fromNode: String(e.fromNode),
      toNode: String(e.toNode),
      fromSide: String(e.fromSide ?? 'right'),
      toSide: String(e.toSide ?? 'left'),
      fromEnd: String(e.fromEnd ?? 'none'),
      toEnd: String(e.toEnd ?? 'arrow'),
      label: String(e.label ?? ''),
      color: e.color ? String(e.color) : '',
    }));

  return { cards, edges };
}
