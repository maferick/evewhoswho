import { NextRequest, NextResponse } from 'next/server';

import { getDefaultSession } from '@/lib/auth';
import {
  loadDraftOrgchart,
  savePublishedOrgchart,
  validateOrgchart,
  writeSnapshot,
} from '@/lib/config/orgchart';

function ensureAdmin() {
  const session = getDefaultSession();
  return session.user.role === 'admin' ? session : null;
}

export async function POST(req: NextRequest) {
  const session = ensureAdmin();
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
  const snapshotPath = await writeSnapshot(draft, body.actor ?? session.user.email);

  return NextResponse.json({
    ok: true,
    publishedBy: body.actor ?? session.user.email,
    snapshotPath,
  });
}
