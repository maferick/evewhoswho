import { ensureServerEnv } from '@/lib/env/server-env';

export type SeatUser = {
  user_id: number;
  character_ids: number[];
  group_ids: number[];
};

export type SeatRole = {
  id: number;
  title: string;
  description: string;
};

type SeatPage<T> = {
  data?: T[];
  links?: {
    next?: string | null;
  };
};

function getSeatBaseUrl(): string {
  ensureServerEnv();
  const baseUrl = process.env.SEAT_BASE_URL;
  if (!baseUrl) {
    throw new Error('SEAT_* not configured');
  }

  return baseUrl.replace(/\/$/, '');
}

function getSeatToken(): string {
  ensureServerEnv();
  const token = process.env.SEAT_TOKEN;
  if (!token) {
    throw new Error('SEAT_* not configured');
  }

  return token;
}

export class SeatClient {
  private readonly baseUrl: string;

  private readonly token: string;

  constructor(baseUrl = getSeatBaseUrl(), token = getSeatToken()) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(pathOrUrl: string): Promise<SeatPage<T>> {
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${this.baseUrl}${pathOrUrl}`;
    const response = await fetch(url, {
      headers: {
        'X-Token': this.token,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`SeAT request failed (${response.status}): ${url}`);
    }

    return (await response.json()) as SeatPage<T>;
  }

  async getUsers(pathOrUrl = '/api/v2/users'): Promise<SeatPage<SeatUser>> {
    return this.request<SeatUser>(pathOrUrl);
  }

  async getRoles(pathOrUrl = '/api/v2/roles'): Promise<SeatPage<SeatRole>> {
    return this.request<SeatRole>(pathOrUrl);
  }

  async getAllUsersPaginated(): Promise<SeatUser[]> {
    const users: SeatUser[] = [];
    let next: string | null | undefined = '/api/v2/users';

    while (next) {
      const page = await this.getUsers(next);
      users.push(...(page.data ?? []));
      next = page.links?.next;
    }

    return users;
  }

  async getAllRolesPaginated(): Promise<SeatRole[]> {
    const roles: SeatRole[] = [];
    let next: string | null | undefined = '/api/v2/roles';

    while (next) {
      const page = await this.getRoles(next);
      roles.push(...(page.data ?? []));
      next = page.links?.next;
    }

    return roles;
  }
}
