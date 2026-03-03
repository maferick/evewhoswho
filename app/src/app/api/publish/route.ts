import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth';
import {
  loadDraftOrgchart,
  savePublishedOrgchart,
  validateOrgchart,
  writeSnapshot,
} from '@/lib/config/orgchart';

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { actor?: string };
  const draft = await loadDraftOrgchart();
  const validation = await validateOrgchart(draft);

  if (!validation.valid) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Validation failed',
        errors: validation.errors,
      },
      { status: 422 },
    );
  }

  await savePublishedOrgchart(draft);
  const snapshotPath = await writeSnapshot(draft, body.actor ?? session.characterName);

  return NextResponse.json({
    ok: true,
    publishedBy: body.actor ?? session.characterName,
    snapshotPath,
  });
}
