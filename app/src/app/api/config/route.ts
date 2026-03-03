import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth';
import { loadDraftOrgchart, saveDraftOrgchart, validateOrgchart } from '@/lib/config/orgchart';
import type { OrgchartDocument } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const orgchart = await loadDraftOrgchart();
  const validation = await validateOrgchart(orgchart);

  return NextResponse.json({
    ok: validation.valid,
    data: orgchart,
    errors: validation.errors,
    actor: {
      characterId: session.characterId,
      characterName: session.characterName,
    },
  });
}

export async function PUT(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
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
      actor: {
        characterId: session.characterId,
        characterName: session.characterName,
      },
    },
    { status: validation.valid ? 200 : 422 },
  );
}
