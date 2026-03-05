import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test, vi } from 'vitest';

describe('admin allowlist checks', () => {
  let dataDir: string;

  afterEach(async () => {
    vi.resetModules();
    delete process.env.BOOTSTRAP_ADMIN_CHARACTER_NAME;
    if (dataDir) {
      await fs.rm(dataDir, { recursive: true, force: true });
    }
  });

  test('hasAdminAccess checks draft allowlist ids', async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eve-auth-'));
    process.env.DATA_DIR = dataDir;

    const { getDefaultOrgchart, saveDraftOrgchart } = await import('@/lib/config/orgchart');
    const { hasAdminAccess } = await import('@/lib/auth/guard');

    const doc = getDefaultOrgchart();
    doc.permissions.adminCharacterIds = [1001, 1002];
    await saveDraftOrgchart(doc);

    await expect(hasAdminAccess(1001)).resolves.toBe(true);
    await expect(hasAdminAccess(9999)).resolves.toBe(false);
  });

  test('hasAdminAccess allows bootstrap admin by character name env var', async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eve-auth-'));
    process.env.DATA_DIR = dataDir;
    process.env.BOOTSTRAP_ADMIN_CHARACTER_NAME = 'My Main Character';

    const { hasAdminAccess } = await import('@/lib/auth/guard');

    await expect(hasAdminAccess(9999, 'my main character')).resolves.toBe(true);
    await expect(hasAdminAccess(9999, 'someone else')).resolves.toBe(false);

  });
});
