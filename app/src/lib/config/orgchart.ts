import fs from 'node:fs/promises';
import path from 'node:path';

import Ajv from 'ajv';
import type { ErrorObject, ValidateFunction } from 'ajv';
import type {
  AppConfig,
  OrgchartDocument,
  OrgchartEntity,
  ValidationErrorItem,
  ValidationResult,
} from '@/lib/types';

const defaultConfig: AppConfig = {
  chartTitle: "Eve Who's Who",
  refreshIntervalSeconds: 30,
  canPublish: true,
};

const ajv = new Ajv({ allErrors: true });

function resolveSchemaPath(): string {
  const candidates = [
    path.resolve(process.cwd(), '..', 'schemas', 'orgchart.schema.json'),
    path.resolve(process.cwd(), 'schemas', 'orgchart.schema.json'),
  ];

  return candidates[0] ?? '';
}

const SCHEMA_PATH = resolveSchemaPath();
const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), 'data');
const DRAFT_PATH = path.join(DATA_DIR, 'orgchart.draft.json');
const PUBLISHED_PATH = path.join(DATA_DIR, 'orgchart.published.json');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');

let validator: ValidateFunction | null = null;
let validatorPromise: Promise<ValidateFunction> | null = null;

async function getValidator() {
  if (validator) {
    return validator;
  }

  if (validatorPromise) {
    return validatorPromise;
  }

  validatorPromise = (async () => {
    const schema = JSON.parse(await fs.readFile(SCHEMA_PATH, 'utf8')) as { $id?: string };

    if (schema.$id) {
      const existing = ajv.getSchema(schema.$id);
      if (existing) {
        validator = existing;
        return existing;
      }
    }

    validator = ajv.compile(schema);
    return validator;
  })();

  try {
    return await validatorPromise;
  } finally {
    validatorPromise = null;
  }
}

function entity(entityId: string, name: string): OrgchartEntity {
  return { id: entityId, name };
}

export function getPublicConfig(): AppConfig {
  return defaultConfig;
}

export function getDefaultOrgchart(): OrgchartDocument {
  return {
    meta: {
      version: 1,
      title: "Eve Who's Who",
      updatedAt: new Date().toISOString(),
    },
    nodes: {
      corporations: [entity('corp-1', 'Example Corp')],
      directorates: [{ ...entity('dir-1', 'Operations'), corporationId: 'corp-1' }],
      teams: [{ ...entity('team-1', 'Admin Team'), directorateId: 'dir-1' }],
      roles: [{ ...entity('role-1', 'Director'), teamId: 'team-1' }],
    },
    edges: [
      { id: 'edge-1', sourceId: 'corp-1', targetId: 'dir-1' },
      { id: 'edge-2', sourceId: 'dir-1', targetId: 'team-1' },
      { id: 'edge-3', sourceId: 'team-1', targetId: 'role-1' },
    ],
    permissions: {
      adminCharacterIds: [],
    },
  };
}

async function readJson(filePath: string): Promise<OrgchartDocument | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as OrgchartDocument;
  } catch {
    return null;
  }
}

async function writeJson(filePath: string, data: OrgchartDocument): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeActor(actor: string): string {
  return actor.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function toValidationItems(errors: ErrorObject[] | null | undefined): ValidationErrorItem[] {
  if (!errors) {
    return [];
  }

  return errors.map((error) => ({
    path: String(('instancePath' in error && error.instancePath) ? error.instancePath : '/'),
    message: error.message ?? 'Invalid value',
    code: `schema:${error.keyword}`,
  }));
}

function getDuplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      dupes.add(value);
    }

    seen.add(value);
  }

  return [...dupes];
}

function runBusinessChecks(orgchart: OrgchartDocument): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  const nodeIds = [
    ...orgchart.nodes.corporations.map((item) => item.id),
    ...orgchart.nodes.directorates.map((item) => item.id),
    ...orgchart.nodes.teams.map((item) => item.id),
    ...orgchart.nodes.roles.map((item) => item.id),
  ];

  const duplicateNodeIds = getDuplicateValues(nodeIds);
  for (const duplicateId of duplicateNodeIds) {
    errors.push({
      path: '/nodes',
      message: `Duplicate node id: ${duplicateId}`,
      code: 'business:duplicate-node-id',
    });
  }

  const duplicateEdgeIds = getDuplicateValues(orgchart.edges.map((item) => item.id));
  for (const duplicateId of duplicateEdgeIds) {
    errors.push({
      path: '/edges',
      message: `Duplicate edge id: ${duplicateId}`,
      code: 'business:duplicate-edge-id',
    });
  }

  const nodeIdSet = new Set(nodeIds);
  orgchart.edges.forEach((edge, index) => {
    if (!nodeIdSet.has(edge.sourceId) || !nodeIdSet.has(edge.targetId)) {
      errors.push({
        path: `/edges/${index}`,
        message: `Orphan edge ${edge.id} points to missing nodes`,
        code: 'business:orphan-edge',
      });
    }
  });

  const requiredNodeGroups = [
    { key: 'corporations', minCount: 1 },
    { key: 'directorates', minCount: 1 },
    { key: 'teams', minCount: 1 },
    { key: 'roles', minCount: 1 },
  ] as const;

  requiredNodeGroups.forEach((group) => {
    if (orgchart.nodes[group.key].length < group.minCount) {
      errors.push({
        path: `/nodes/${group.key}`,
        message: `At least ${group.minCount} ${group.key} node is required`,
        code: 'business:required-top-level-nodes',
      });
    }
  });

  return errors;
}

export async function validateOrgchart(orgchart: OrgchartDocument): Promise<ValidationResult> {
  const check = await getValidator();
  const isValid = check(orgchart);

  const errors = [...toValidationItems(check.errors), ...runBusinessChecks(orgchart)];

  return {
    valid: isValid && errors.length === 0,
    errors,
  };
}

export async function loadDraftOrgchart(): Promise<OrgchartDocument> {
  const existing = await readJson(DRAFT_PATH);
  if (existing) {
    return existing;
  }

  const fallback = (await readJson(PUBLISHED_PATH)) ?? getDefaultOrgchart();
  await saveDraftOrgchart(fallback);
  return fallback;
}

export async function loadPublishedOrgchart(): Promise<OrgchartDocument> {
  const published = await readJson(PUBLISHED_PATH);
  if (published) {
    return published;
  }

  return getDefaultOrgchart();
}

export async function saveDraftOrgchart(orgchart: OrgchartDocument): Promise<void> {
  const next = {
    ...orgchart,
    meta: {
      ...orgchart.meta,
      updatedAt: new Date().toISOString(),
    },
  };

  await writeJson(DRAFT_PATH, next);
}

export async function savePublishedOrgchart(orgchart: OrgchartDocument): Promise<void> {
  await writeJson(PUBLISHED_PATH, orgchart);
}

export async function writeSnapshot(orgchart: OrgchartDocument, actor: string): Promise<string> {
  await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}-${normalizeActor(actor)}.json`;
  const snapshotPath = path.join(SNAPSHOTS_DIR, filename);

  await writeJson(snapshotPath, orgchart);

  return snapshotPath;
}
