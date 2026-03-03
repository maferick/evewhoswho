import { NextResponse } from 'next/server';

import {
  buildAuthorizeUrl,
  createStateToken,
  getCookieOptions,
  getStateCookieName,
} from '@/lib/auth';

export async function GET() {
  try {
    const state = createStateToken();
    const redirectUrl = buildAuthorizeUrl(state);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set(getStateCookieName(), state, getCookieOptions(10 * 60));

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to initialize login',
      },
      { status: 500 },
    );
  }
}
