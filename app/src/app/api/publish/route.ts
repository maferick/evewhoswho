import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth';
import { appendAuditEntry, summarizeChanges } from '@/lib/audit';
import {
  loadDraftOrgchart,
  loadPublishedOrgchart,
  savePublishedOrgchart,
  validateOrgchart,
  writeSnapshot,
} from '@/lib/config/orgchart';
import { cacheRenderedArtifacts, hashOrgchart } from '@/lib/render';

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { actor?: string };
  const actor = body.actor ?? session.characterName;

  // 1. Validate draft
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

  const previousPublished = await loadPublishedOrgchart();

  // 2. Snapshot draft
  const snapshotPath = await writeSnapshot(draft, actor);

  // 3. Promote draft to published
  await savePublishedOrgchart(draft);

  // 4. Regenerate artifacts
  const render = await cacheRenderedArtifacts(draft);

  // 5. Write audit entry
  const configHash = hashOrgchart(draft);
  const changeSummary = summarizeChanges(previousPublished, draft);
  await appendAuditEntry({
    actor,
    timestamp: new Date().toISOString(),
    configHash,
    changeSummary,
  });

  return NextResponse.json({
    ok: true,
    publishedBy: actor,
    snapshotPath,
    chartHash: render.hash,
    artifacts: {
      svgLatest: '/api/chart.svg',
      pngLatest: '/api/chart.png',
      svgImmutable: `/api/chart.svg?hash=${render.hash}`,
      pngImmutable: `/api/chart.png?hash=${render.hash}`,
    },
  });
}
