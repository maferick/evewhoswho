import { NextRequest, NextResponse } from 'next/server';

import {
  createSessionPayload,
  exchangeCodeForToken,
  getCookieOptions,
  getSessionCookieName,
  getStateCookieName,
  sealSession,
  verifyAccessToken,
} from '@/lib/auth';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const expectedState = req.cookies.get(getStateCookieName())?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.json({ ok: false, error: 'Invalid callback state' }, { status: 400 });
  }

  try {
    const token = await exchangeCodeForToken(code);
    const verified = await verifyAccessToken(token.access_token);

    const payload = createSessionPayload(verified.CharacterID, verified.CharacterName);
    const sealedSession = sealSession(payload);

    const response = NextResponse.redirect(new URL('/admin', req.url));
    response.cookies.set(getSessionCookieName(), sealedSession, getCookieOptions(8 * 60 * 60));
    response.cookies.set(getStateCookieName(), '', getCookieOptions(0));

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      },
      { status: 500 },
    );
  }
}
