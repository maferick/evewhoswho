import { getRequiredEnv } from '@/lib/env';

const EVE_AUTHORIZE_URL = 'https://login.eveonline.com/v2/oauth/authorize';
const EVE_TOKEN_URL = 'https://login.eveonline.com/v2/oauth/token';
const EVE_VERIFY_URL = 'https://login.eveonline.com/oauth/verify';

export type EveTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
};

export type EveVerifyResponse = {
  CharacterID: number;
  CharacterName: string;
  ExpiresOn: string;
  Scopes: string;
  TokenType: string;
  CharacterOwnerHash: string;
  IntellectualProperty: string;
};

export function buildAuthorizeUrl(state: string): string {
  const clientId = getRequiredEnv('EVE_SSO_CLIENT_ID');
  const redirectUri = getRequiredEnv('EVE_SSO_CALLBACK_URL');

  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: redirectUri,
    client_id: clientId,
    scope: 'publicData',
    state,
  });

  return `${EVE_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<EveTokenResponse> {
  const clientId = getRequiredEnv('EVE_SSO_CLIENT_ID');
  const clientSecret = getRequiredEnv('EVE_SSO_CLIENT_SECRET');
  const redirectUri = getRequiredEnv('EVE_SSO_CALLBACK_URL');

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(EVE_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed with status ${response.status}`);
  }

  return (await response.json()) as EveTokenResponse;
}

export async function verifyAccessToken(accessToken: string): Promise<EveVerifyResponse> {
  const response = await fetch(EVE_VERIFY_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Token verification failed with status ${response.status}`);
  }

  return (await response.json()) as EveVerifyResponse;
}
