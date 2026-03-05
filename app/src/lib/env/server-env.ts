import 'server-only';

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

let loaded = false;

function parseDotEnv(content: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    if (!key) {
      continue;
    }

    let value = line.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function loadRootDotenv() {
  if (loaded) {
    return;
  }

  const envPath = path.resolve(process.cwd(), '../.env');
  if (existsSync(envPath)) {
    const parsed = parseDotEnv(readFileSync(envPath, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }

  loaded = true;
}

export function ensureServerEnv() {
  loadRootDotenv();

  const baseUrl = process.env.SEAT_BASE_URL;
  const token = process.env.SEAT_TOKEN;

  if (!baseUrl || !token) {
    throw new Error('SEAT_* not configured');
  }
}
