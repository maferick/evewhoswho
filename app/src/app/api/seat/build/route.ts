import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth';
import { validateOrgchart } from '@/lib/config/orgchart';
import { buildOrgchartFromSeat } from '@/lib/seat/build';
import { loadSeatMapping, loadSeatSnapshot, writeOrgchartDraftRaw } from '@/lib/seat/storage';

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const snapshot = await loadSeatSnapshot();
  if (!snapshot) {
    return NextResponse.json({ ok: false, error: 'No SeAT snapshot found. Run sync first.' }, { status: 400 });
  }

  const mapping = await loadSeatMapping();
  const chart = buildOrgchartFromSeat(snapshot, mapping);
  const validation = await validateOrgchart(chart);
  if (!validation.valid) {
    return NextResponse.json({ ok: false, error: 'Generated chart failed validation', errors: validation.errors }, { status: 422 });
  }

  await writeOrgchartDraftRaw(JSON.stringify(chart, null, 2));

  return NextResponse.json({ ok: true, nodes: chart.nodes.roles.length, edges: chart.edges.length });
}
