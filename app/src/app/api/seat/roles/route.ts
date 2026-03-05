import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth';
import { loadSeatSnapshot } from '@/lib/seat/storage';

export async function GET(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const snapshot = await loadSeatSnapshot();
  if (!snapshot) {
    return NextResponse.json({ ok: false, error: 'No SeAT snapshot found. Run sync first.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data: snapshot.roles });
}
