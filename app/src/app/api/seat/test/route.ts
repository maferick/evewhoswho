import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth';
import { SeatClient } from '@/lib/seat/client';

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = new SeatClient();
    const [users, roles] = await Promise.all([client.getUsers(), client.getRoles()]);

    return NextResponse.json({
      ok: true,
      stats: {
        users: users.data?.length ?? 0,
        roles: roles.data?.length ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'SeAT test failed' },
      { status: 502 },
    );
  }
}
