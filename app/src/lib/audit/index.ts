import fs from 'node:fs/promises';
import path from 'node:path';

import type { OrgchartDocument } from '@/lib/types';

const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), 'data');
const AUDIT_LOG_PATH = path.join(DATA_DIR, 'audit.log');

export type AuditEntry = {
  actor: string;
  timestamp: string;
  configHash: string;
  changeSummary: string;
};

function countNodes(doc: OrgchartDocument): number {
  return (
    doc.nodes.corporations.length +
    doc.nodes.directorates.length +
    doc.nodes.teams.length +
    doc.nodes.roles.length
  );
}

export function summarizeChanges(previous: OrgchartDocument, next: OrgchartDocument): string {
  const prevNodes = countNodes(previous);
  const nextNodes = countNodes(next);
  const edgeDelta = next.edges.length - previous.edges.length;
  const nodeDelta = nextNodes - prevNodes;
  const titleChanged = previous.meta.title !== next.meta.title;

  return [
    titleChanged ? `title: \"${previous.meta.title}\" -> \"${next.meta.title}\"` : 'title: unchanged',
    `nodes: ${prevNodes} -> ${nextNodes} (${nodeDelta >= 0 ? '+' : ''}${nodeDelta})`,
    `edges: ${previous.edges.length} -> ${next.edges.length} (${edgeDelta >= 0 ? '+' : ''}${edgeDelta})`,
  ].join('; ');
}

export async function appendAuditEntry(entry: AuditEntry): Promise<string> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const line = `${JSON.stringify(entry)}\n`;
  const handle = await fs.open(AUDIT_LOG_PATH, 'a');

  try {
    await handle.appendFile(line, 'utf8');
  } finally {
    await handle.close();
  }

  return AUDIT_LOG_PATH;
}

export function getAuditLogPath(): string {
  return AUDIT_LOG_PATH;
}
