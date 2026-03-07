import { ensureServerEnv } from '@/lib/env/server-env';

export type SeatUser = {
  user_id: number;
  character_ids: number[];
  name?: string;
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

export type SeatRoleDetailUser = {
  user_id: number;
  name?: string;
  character_ids?: number[];
};

export type SeatRoleDetail = {
  id: number;
  permissions?: unknown[];
  affiliations?: unknown[];
  users?: SeatRoleDetailUser[];
};

type SeatRoleDetailResponse = SeatRoleDetail | { data?: SeatRoleDetail };

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

  private async request<T>(pathOrUrl: string): Promise<T> {
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

    return (await response.json()) as T;
  }

  async getUsers(pathOrUrl = '/api/v2/users'): Promise<SeatPage<SeatUser>> {
    return this.request<SeatPage<SeatUser>>(pathOrUrl);
  }

  async getRoles(pathOrUrl = '/api/v2/roles'): Promise<SeatPage<SeatRole>> {
    return this.request<SeatPage<SeatRole>>(pathOrUrl);
  }

  async getRoleDetail(roleId: number): Promise<SeatRoleDetail> {
    const response = await this.request<SeatRoleDetailResponse>(`/api/v1/role/detail/${roleId}`);
    const detail = 'data' in response ? (response.data ?? { id: roleId }) : response;

    return {
      id: Number(detail.id ?? roleId),
      permissions: detail.permissions ?? [],
      affiliations: detail.affiliations ?? [],
      users: Array.isArray(detail.users) ? detail.users : [],
    };
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
