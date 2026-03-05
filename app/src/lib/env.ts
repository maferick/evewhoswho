import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

let cachedEnvFileValues: Record<string, string> | null = null;

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

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function loadFallbackEnvFileValues(): Record<string, string> {
  if (cachedEnvFileValues) {
    return cachedEnvFileValues;
  }

  const envValues: Record<string, string> = {};
  const candidates = [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '..', '.env')];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) {
      continue;
    }

    const parsed = parseDotEnv(readFileSync(envPath, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in envValues)) {
        envValues[key] = value;
      }
    }
  }

  cachedEnvFileValues = envValues;
  return envValues;
}

export function getEnv(name: string): string | undefined {
  const runtimeValue = process.env[name];
  if (runtimeValue) {
    return runtimeValue;
  }

  return loadFallbackEnvFileValues()[name];
}

export function getRequiredEnv(name: string): string {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}
