import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth';
import { buildOrgchartFromSeat } from '@/lib/seat/build';
import { loadSeatMapping, loadSeatSnapshot } from '@/lib/seat/storage';

export async function GET(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const snapshot = await loadSeatSnapshot();
  if (!snapshot) {
    return NextResponse.json({ ok: false, error: 'No SeAT snapshot found. Run sync first.' }, { status: 400 });
  }

  const mapping = await loadSeatMapping();
  const preview = buildOrgchartFromSeat(snapshot, mapping);

  return NextResponse.json({
    ok: true,
    generatedAt: snapshot.generated_at,
    users: snapshot.users.length,
    roles: snapshot.roles.length,
    mappedRoles: preview.nodes.roles.length,
    rolesList: snapshot.roles,
    preview,
  });
}
