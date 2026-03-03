import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { OrgchartDocument } from '@/lib/types';

export type RenderFormat = 'svg' | 'png';

export type RenderArtifact = {
  hash: string;
  svg: string;
  png: Buffer | null;
};

type RenderNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'corporation' | 'directorate' | 'team' | 'role';
};

type RenderEdge = {
  id: string;
  sourceId: string;
  targetId: string;
};

const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), 'data');
const RENDER_CACHE_DIR = path.join(DATA_DIR, 'render-cache');
const WIDTH = 1280;
const HEIGHT = 900;
const PADDING_X = 90;
const PADDING_Y = 80;
const LAYER_GAP = 170;
const COLUMN_GAP = 200;

const COLORS: Record<RenderNode['kind'], string> = {
  corporation: '#1d4ed8',
  directorate: '#2563eb',
  team: '#0284c7',
  role: '#0f766e',
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}

export function hashOrgchart(orgchart: OrgchartDocument): string {
  return crypto.createHash('sha256').update(stableStringify(orgchart)).digest('hex').slice(0, 16);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toGraph(orgchart: OrgchartDocument): { nodes: RenderNode[]; edges: RenderEdge[] } {
  const corp = [...orgchart.nodes.corporations].sort((a, b) => a.id.localeCompare(b.id));
  const dir = [...orgchart.nodes.directorates].sort((a, b) => a.id.localeCompare(b.id));
  const teams = [...orgchart.nodes.teams].sort((a, b) => a.id.localeCompare(b.id));
  const roles = [...orgchart.nodes.roles].sort((a, b) => a.id.localeCompare(b.id));

  const byId = new Map<string, RenderNode>();
  const nodes: RenderNode[] = [];

  const push = (kind: RenderNode['kind'], id: string, label: string) => {
    const node: RenderNode = { id, label, x: 0, y: 0, width: 180, height: 56, kind };
    byId.set(id, node);
    nodes.push(node);
  };

  corp.forEach((item) => push('corporation', item.id, item.name));
  dir.forEach((item) => push('directorate', item.id, item.name));
  teams.forEach((item) => push('team', item.id, item.name));
  roles.forEach((item) => push('role', item.id, item.name));

  const edges: RenderEdge[] = [...orgchart.edges]
    .sort((a, b) => a.id.localeCompare(b.id))
    .filter((edge) => byId.has(edge.sourceId) && byId.has(edge.targetId));

  const layers = [corp.map((x) => x.id), dir.map((x) => x.id), teams.map((x) => x.id), roles.map((x) => x.id)];
  layers.forEach((layer, layerIndex) => {
    const totalWidth = (layer.length - 1) * COLUMN_GAP;
    const left = Math.max(PADDING_X, Math.floor((WIDTH - totalWidth) / 2));
    layer.forEach((nodeId, col) => {
      const node = byId.get(nodeId);
      if (!node) return;
      node.x = left + col * COLUMN_GAP;
      node.y = PADDING_Y + layerIndex * LAYER_GAP;
    });
  });

  return { nodes, edges };
}

function buildSvg(orgchart: OrgchartDocument, hash: string): string {
  const { nodes, edges } = toGraph(orgchart);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const edgeLines = edges
    .map((edge) => {
      const source = nodeById.get(edge.sourceId);
      const target = nodeById.get(edge.targetId);
      if (!source || !target) return '';

      const x1 = source.x;
      const y1 = source.y + source.height / 2;
      const x2 = target.x;
      const y2 = target.y - target.height / 2;

      return `<path id="edge-${escapeXml(edge.id)}" d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="#94a3b8" stroke-width="2"/>`;
    })
    .filter(Boolean)
    .join('\n    ');

  const nodeBoxes = nodes
    .map((node) => {
      const x = node.x - node.width / 2;
      const y = node.y - node.height / 2;
      return `<g id="node-${escapeXml(node.id)}" data-kind="${node.kind}">
      <rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" rx="10" ry="10" fill="${COLORS[node.kind]}"/>
      <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" fill="#f8fafc" font-size="14" font-family="Inter, Segoe UI, Roboto, Arial, sans-serif">${escapeXml(node.label)}</text>
    </g>`;
    })
    .join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg id="chart-${hash}" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(orgchart.meta.title)}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#020617"/>
  <text x="${WIDTH / 2}" y="42" text-anchor="middle" fill="#e2e8f0" font-size="24" font-family="Inter, Segoe UI, Roboto, Arial, sans-serif">${escapeXml(orgchart.meta.title)}</text>
  <g id="edges">
    ${edgeLines}
  </g>
  <g id="nodes">
    ${nodeBoxes}
  </g>
</svg>`;
}

async function svgToPng(svg: string): Promise<Buffer | null> {
  try {
    const localRequire = eval('require') as NodeRequire;
    const sharpModule = localRequire('sharp') as {
      default?: (input: Buffer) => { png: () => { toBuffer: () => Promise<Buffer> } };
    };
    const sharpFactory = sharpModule.default ?? (sharpModule as unknown as (input: Buffer) => { png: () => { toBuffer: () => Promise<Buffer> } });
    return await sharpFactory(Buffer.from(svg)).png().toBuffer();
  } catch {
    return null;
  }
}

export async function renderOrgchart(orgchart: OrgchartDocument): Promise<RenderArtifact> {
  const hash = hashOrgchart(orgchart);
  const svg = buildSvg(orgchart, hash);
  const png = await svgToPng(svg);
  return { hash, svg, png };
}

async function writeFileIfMissing(filePath: string, data: string | Buffer): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, data);
  }
}

export async function cacheRenderedArtifacts(orgchart: OrgchartDocument): Promise<RenderArtifact> {
  await fs.mkdir(RENDER_CACHE_DIR, { recursive: true });

  const artifact = await renderOrgchart(orgchart);
  const svgImmutable = path.join(RENDER_CACHE_DIR, `chart.${artifact.hash}.svg`);
  const pngImmutable = path.join(RENDER_CACHE_DIR, `chart.${artifact.hash}.png`);

  await writeFileIfMissing(svgImmutable, artifact.svg);
  if (artifact.png) {
    await writeFileIfMissing(pngImmutable, artifact.png);
  }

  await fs.writeFile(path.join(RENDER_CACHE_DIR, 'chart.svg'), artifact.svg);
  if (artifact.png) {
    await fs.writeFile(path.join(RENDER_CACHE_DIR, 'chart.png'), artifact.png);
  }

  return artifact;
}

export async function readCachedArtifact(format: RenderFormat, hash?: string): Promise<Buffer | null> {
  const filename = hash ? `chart.${hash}.${format}` : `chart.${format}`;
  const filePath = path.join(RENDER_CACHE_DIR, filename);

  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}
