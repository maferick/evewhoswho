import { NextRequest, NextResponse } from 'next/server';

import {
  getCookieOptions,
  getSessionCookieName,
  getStateCookieName,
  getRequestSession,
  hasAdminAccess,
} from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getRequestSession(req);

  if (!session) {
    return NextResponse.json({ ok: true, authenticated: false });
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    characterId: session.characterId,
    characterName: session.characterName,
    isAdmin: await hasAdminAccess(session.characterId, session.characterName),
    expiresAt: session.expiresAt,
  });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true, authenticated: false });
  response.cookies.set(getSessionCookieName(), '', getCookieOptions(0));
  response.cookies.set(getStateCookieName(), '', getCookieOptions(0));
  return response;
}
