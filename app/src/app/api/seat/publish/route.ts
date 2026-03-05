import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth';
import { appendAuditEntry } from '@/lib/audit';
import { publishDraftToPublished } from '@/lib/seat/storage';

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  await publishDraftToPublished();
  await appendAuditEntry({
    actor: session.characterName,
    timestamp: new Date().toISOString(),
    configHash: 'seat-publish',
    changeSummary: 'Published generated SeAT draft',
  });

  return NextResponse.json({ ok: true });
}
