import { createHash, createCipheriv, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const sessionCookieName = 'evewhoswho_session';

function sealSession(secret: string, payload: object): string {
  const key = createHash('sha256').update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((value) => value.toString('base64url')).join('.');
}

async function seedAdminDraft(dataDir: string, adminCharacterId: number) {
  const doc = {
    meta: { version: 1, title: "Eve Who's Who", updatedAt: '2024-01-01T00:00:00.000Z' },
    nodes: {
      corporations: [{ id: 'corp-1', name: 'Example Corp' }],
      directorates: [{ id: 'dir-1', name: 'Operations', corporationId: 'corp-1' }],
      teams: [{ id: 'team-1', name: 'Admin Team', directorateId: 'dir-1' }],
      roles: [{ id: 'role-1', name: 'Director', teamId: 'team-1' }],
    },
    edges: [
      { id: 'edge-1', sourceId: 'corp-1', targetId: 'dir-1' },
      { id: 'edge-2', sourceId: 'dir-1', targetId: 'team-1' },
      { id: 'edge-3', sourceId: 'team-1', targetId: 'role-1' },
    ],
    permissions: { adminCharacterIds: [adminCharacterId] },
  };

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, 'orgchart.draft.json'), JSON.stringify(doc, null, 2));
  await fs.writeFile(path.join(dataDir, 'orgchart.published.json'), JSON.stringify(doc, null, 2));
}

test('admin can login, edit, preview, publish, and public SVG updates', async ({ page, context, request, baseURL }) => {
  const secret = process.env.SESSION_SECRET;
  const dataDir = process.env.DATA_DIR;
  test.skip(!secret || !dataDir || !baseURL, 'SESSION_SECRET, DATA_DIR and baseURL are required');

  const characterId = 4242;
  await seedAdminDraft(dataDir!, characterId);

  const token = sealSession(secret!, {
    characterId,
    characterName: 'Test Admin',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  await context.addCookies([
    {
      name: sessionCookieName,
      value: token,
      url: baseURL!,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
  await expect(page.getByText('Signed in as: Test Admin')).toBeVisible();

  const editor = page.getByLabel('Draft orgchart JSON');
  await editor.fill((await editor.inputValue()).replace("Eve Who's Who", 'E2E Published Chart'));

  await page.getByRole('button', { name: 'Save & Validate Draft' }).click();
  await expect(page.getByText('Draft saved.')).toBeVisible();

  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText(/Published successfully/)).toBeVisible();

  const svgRes = await request.get('/api/chart.svg');
  await expect(svgRes.ok()).toBeTruthy();
  const svg = await svgRes.text();
  expect(svg).toContain('E2E Published Chart');
});
