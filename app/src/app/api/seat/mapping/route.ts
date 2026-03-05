import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth';
import { loadSeatMapping, saveSeatMapping, type SeatMapping } from '@/lib/seat/storage';

export async function GET(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const mapping = await loadSeatMapping();
  return NextResponse.json({ ok: true, data: mapping });
}

export async function PUT(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json()) as SeatMapping;
  await saveSeatMapping({
    roleMappings: body.roleMappings ?? {},
    includeRoles: body.includeRoles ?? [],
    roleBuckets: body.roleBuckets ?? {},
  });

  return NextResponse.json({ ok: true });
}
