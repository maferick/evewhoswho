import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth';
import { SeatClient } from '@/lib/seat/client';
import { normalizeSeatSnapshot, writeSeatSnapshot } from '@/lib/seat/storage';

const ROLE_DETAIL_CONCURRENCY = 8;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = new SeatClient();
    const [users, roles] = await Promise.all([client.getAllUsersPaginated(), client.getAllRolesPaginated()]);
    const roleDetails = await mapWithConcurrency(roles, ROLE_DETAIL_CONCURRENCY, (role) => client.getRoleDetail(role.id));
    const snapshot = normalizeSeatSnapshot(users, roles, roleDetails);
    const output = await writeSeatSnapshot(snapshot);

    return NextResponse.json({
      ok: true,
      generatedAt: snapshot.generated_at,
      users: snapshot.users.length,
      roles: snapshot.roles.length,
      files: output,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'SeAT sync failed' },
      { status: 502 },
    );
  }
}
