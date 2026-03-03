import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test, vi } from 'vitest';

describe('audit writer', () => {
  let dataDir: string;

  afterEach(async () => {
    vi.resetModules();
    if (dataDir) {
      await fs.rm(dataDir, { recursive: true, force: true });
    }
  });

  test('appends newline-delimited audit entries to DATA_DIR/audit.log', async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eve-audit-'));
    process.env.DATA_DIR = dataDir;

    const { appendAuditEntry, getAuditLogPath } = await import('@/lib/audit');

    await appendAuditEntry({
      actor: 'alice',
      timestamp: '2024-01-01T00:00:00.000Z',
      configHash: 'abc123',
      changeSummary: 'nodes: 4 -> 5 (+1)',
    });
    await appendAuditEntry({
      actor: 'bob',
      timestamp: '2024-01-01T01:00:00.000Z',
      configHash: 'def456',
      changeSummary: 'nodes: 5 -> 6 (+1)',
    });

    const raw = await fs.readFile(getAuditLogPath(), 'utf8');
    const lines = raw.trim().split('\n');

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).actor).toBe('alice');
    expect(JSON.parse(lines[1]).actor).toBe('bob');
  });
});
