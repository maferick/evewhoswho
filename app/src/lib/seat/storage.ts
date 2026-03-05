import fs from 'node:fs/promises';
import path from 'node:path';

import type { SeatRole, SeatUser } from '@/lib/seat/client';

export type SeatSnapshot = {
  users: Array<{
    user_id: number;
    character_ids: number[];
    role_ids: number[];
  }>;
  roles: Array<{
    id: number;
    title: string;
    description: string;
  }>;
  generated_at: string;
};

export type SeatMapping = {
  roleMappings: Record<string, string>;
  includeRoles: number[];
  roleBuckets: Record<string, number[]>;
};

const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), 'data');
const SEAT_DIR = path.join(DATA_DIR, 'seat');
const SNAPSHOTS_DIR = path.join(SEAT_DIR, 'snapshots');
const LATEST_SNAPSHOT_PATH = path.join(SNAPSHOTS_DIR, 'seat.latest.json');
const MAPPING_PATH = path.join(SEAT_DIR, 'mapping.json');
const ORGCHART_DRAFT_PATH = path.join(DATA_DIR, 'orgchart.draft.json');
const ORGCHART_PUBLISHED_PATH = path.join(DATA_DIR, 'orgchart.published.json');

const DEFAULT_MAPPING: SeatMapping = {
  roleMappings: {},
  includeRoles: [],
  roleBuckets: {},
};

export function normalizeSeatSnapshot(users: SeatUser[], roles: SeatRole[]): SeatSnapshot {
  return {
    users: users.map((user) => ({
      user_id: user.user_id,
      character_ids: user.character_ids ?? [],
      role_ids: user.group_ids ?? [],
    })),
    roles: roles.map((role) => ({
      id: role.id,
      title: role.title,
      description: role.description,
    })),
    generated_at: new Date().toISOString(),
  };
}

export async function writeSeatSnapshot(snapshot: SeatSnapshot): Promise<{ latestPath: string; timestampPath: string }> {
  await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const timestampPath = path.join(SNAPSHOTS_DIR, `seat.${timestamp}.json`);

  const serialized = JSON.stringify(snapshot, null, 2);
  await fs.writeFile(timestampPath, serialized, 'utf8');
  await fs.writeFile(LATEST_SNAPSHOT_PATH, serialized, 'utf8');

  return { latestPath: LATEST_SNAPSHOT_PATH, timestampPath };
}

export async function loadSeatSnapshot(): Promise<SeatSnapshot | null> {
  try {
    const raw = await fs.readFile(LATEST_SNAPSHOT_PATH, 'utf8');
    return JSON.parse(raw) as SeatSnapshot;
  } catch {
    return null;
  }
}

export async function loadSeatMapping(): Promise<SeatMapping> {
  try {
    const raw = await fs.readFile(MAPPING_PATH, 'utf8');
    return {
      ...DEFAULT_MAPPING,
      ...(JSON.parse(raw) as SeatMapping),
    };
  } catch {
    await saveSeatMapping(DEFAULT_MAPPING);
    return DEFAULT_MAPPING;
  }
}

export async function saveSeatMapping(mapping: SeatMapping): Promise<void> {
  await fs.mkdir(path.dirname(MAPPING_PATH), { recursive: true });
  await fs.writeFile(MAPPING_PATH, JSON.stringify(mapping, null, 2), 'utf8');
}

export async function loadOrgchartDraftRaw(): Promise<string | null> {
  try {
    return await fs.readFile(ORGCHART_DRAFT_PATH, 'utf8');
  } catch {
    return null;
  }
}

export async function writeOrgchartDraftRaw(raw: string): Promise<void> {
  await fs.mkdir(path.dirname(ORGCHART_DRAFT_PATH), { recursive: true });
  await fs.writeFile(ORGCHART_DRAFT_PATH, raw, 'utf8');
}

export async function publishDraftToPublished(): Promise<void> {
  const raw = await fs.readFile(ORGCHART_DRAFT_PATH, 'utf8');
  await fs.writeFile(ORGCHART_PUBLISHED_PATH, raw, 'utf8');
}
