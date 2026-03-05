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
    const message = error instanceof Error ? error.message : 'SeAT test failed';

    if (message === 'SEAT_* not configured') {
      return NextResponse.json({ ok: false, error: 'SEAT_* not configured' }, { status: 500 });
    }

    if (message.includes('SeAT request failed (401):')) {
      return NextResponse.json({ ok: false, error: 'Unauthorized (check X-Token)' }, { status: 401 });
    }

    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
