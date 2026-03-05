import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth';
import { SeatClient } from '@/lib/seat/client';
import { normalizeSeatSnapshot, writeSeatSnapshot } from '@/lib/seat/storage';

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = new SeatClient();
    const [users, roles] = await Promise.all([client.getAllUsersPaginated(), client.getAllRolesPaginated()]);
    const snapshot = normalizeSeatSnapshot(users, roles);
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
