import type { NextRequest } from 'next/server';

import { loadDraftOrgchart } from '@/lib/config/orgchart';
import { getEnv } from '@/lib/env';
import {
  getSessionCookieName,
  type SessionPayload,
  unsealSession,
} from '@/lib/auth/session';

const BOOTSTRAP_ADMIN_CHARACTER_NAME_ENV = 'BOOTSTRAP_ADMIN_CHARACTER_NAME';

function getBootstrapAdminCharacterName(): string | null {
  const configured = getEnv(BOOTSTRAP_ADMIN_CHARACTER_NAME_ENV);
  if (!configured) {
    return null;
  }

  const normalized = configured.trim().toLowerCase();
  return normalized || null;
}

export async function getRequestSession(req: NextRequest): Promise<SessionPayload | null> {
  const rawSession = req.cookies.get(getSessionCookieName())?.value;
  if (!rawSession) {
    return null;
  }

  return unsealSession(rawSession);
}

export async function hasAdminAccess(characterId: number, characterName?: string): Promise<boolean> {
  const bootstrapAdminCharacterName = getBootstrapAdminCharacterName();
  if (bootstrapAdminCharacterName && characterName) {
    const normalizedCharacterName = characterName.trim().toLowerCase();
    if (normalizedCharacterName && normalizedCharacterName === bootstrapAdminCharacterName) {
      return true;
    }
  }

  const orgchart = await loadDraftOrgchart();
  return orgchart.permissions.adminCharacterIds.includes(characterId);
}

export async function requireAdminSession(req: NextRequest): Promise<SessionPayload | null> {
  const session = await getRequestSession(req);
  if (!session) {
    return null;
  }

  const isAllowed = await hasAdminAccess(session.characterId, session.characterName);
  return isAllowed ? session : null;
}
