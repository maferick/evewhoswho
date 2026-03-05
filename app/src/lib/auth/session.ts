import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import { getRequiredEnv } from '@/lib/env';

const SESSION_COOKIE_NAME = 'evewhoswho_session';
const STATE_COOKIE_NAME = 'evewhoswho_sso_state';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export type SessionPayload = {
  characterId: number;
  characterName: string;
  expiresAt: string;
};

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function b64UrlEncode(value: Buffer): string {
  return value.toString('base64url');
}

function b64UrlDecode(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

function getSessionSecretKey(): Buffer {
  const secret = getRequiredEnv('SESSION_SECRET');
  return createHash('sha256').update(secret).digest();
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getStateCookieName(): string {
  return STATE_COOKIE_NAME;
}

export function createStateToken(): string {
  return randomBytes(24).toString('base64url');
}

export function createSessionPayload(characterId: number, characterName: string): SessionPayload {
  return {
    characterId,
    characterName,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
}

export function sealSession(payload: SessionPayload): string {
  const key = getSessionSecretKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted].map(b64UrlEncode).join('.');
}

export function unsealSession(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const [ivPart, tagPart, ciphertextPart] = parts;
    const key = getSessionSecretKey();
    const iv = b64UrlDecode(ivPart);
    const tag = b64UrlDecode(tagPart);
    const ciphertext = b64UrlDecode(ciphertextPart);

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const payload = JSON.parse(plaintext) as SessionPayload;

    if (!payload.expiresAt || Number.isNaN(Date.parse(payload.expiresAt))) {
      return null;
    }

    if (Date.parse(payload.expiresAt) <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}
