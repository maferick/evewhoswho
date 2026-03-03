import type { NextRequest } from 'next/server';

import { loadDraftOrgchart } from '@/lib/config/orgchart';
import {
  getSessionCookieName,
  type SessionPayload,
  unsealSession,
} from '@/lib/auth/session';

export async function getRequestSession(req: NextRequest): Promise<SessionPayload | null> {
  const rawSession = req.cookies.get(getSessionCookieName())?.value;
  if (!rawSession) {
    return null;
  }

  return unsealSession(rawSession);
}

export async function hasAdminAccess(characterId: number): Promise<boolean> {
  const orgchart = await loadDraftOrgchart();
  return orgchart.permissions.adminCharacterIds.includes(characterId);
}

export async function requireAdminSession(req: NextRequest): Promise<SessionPayload | null> {
  const session = await getRequestSession(req);
  if (!session) {
    return null;
  }

  const isAllowed = await hasAdminAccess(session.characterId);
  return isAllowed ? session : null;
}
