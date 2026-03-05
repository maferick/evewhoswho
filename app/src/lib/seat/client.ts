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
  const baseUrl = process.env.SEAT_BASE_URL;
  if (!baseUrl) {
    throw new Error('Missing required env var: SEAT_BASE_URL');
  }

  return baseUrl.replace(/\/$/, '');
}

function getSeatApiKey(): string {
  const apiKey = process.env.SEAT_API_KEY;
  if (!apiKey) {
    throw new Error('Missing required env var: SEAT_API_KEY');
  }

  return apiKey;
}

export class SeatClient {
  private readonly baseUrl: string;

  private readonly apiKey: string;

  constructor(baseUrl = getSeatBaseUrl(), apiKey = getSeatApiKey()) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(pathOrUrl: string): Promise<SeatPage<T>> {
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${this.baseUrl}${pathOrUrl}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
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
