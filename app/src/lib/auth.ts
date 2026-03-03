import type { AuthSession } from '@/lib/types';

export function getDefaultSession(): AuthSession {
  return {
    user: {
      id: 'user-1',
      email: 'admin@example.com',
      role: 'admin',
    },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}
