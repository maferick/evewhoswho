import { NextRequest, NextResponse } from 'next/server';

import { getDefaultSession } from '@/lib/auth';
import { loadDraftOrgchart, saveDraftOrgchart, validateOrgchart } from '@/lib/config/orgchart';
import type { OrgchartDocument } from '@/lib/types';

function ensureAdmin() {
  const session = getDefaultSession();
  return session.user.role === 'admin';
}

export async function GET() {
  if (!ensureAdmin()) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const orgchart = await loadDraftOrgchart();
  const validation = await validateOrgchart(orgchart);

  return NextResponse.json({
    ok: validation.valid,
    data: orgchart,
    errors: validation.errors,
  });
}

export async function PUT(req: NextRequest) {
  if (!ensureAdmin()) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json()) as OrgchartDocument;
  await saveDraftOrgchart(body);
  const validation = await validateOrgchart(body);

  return NextResponse.json(
    {
      ok: validation.valid,
      data: body,
      errors: validation.errors,
    },
    { status: validation.valid ? 200 : 422 },
  );
}
