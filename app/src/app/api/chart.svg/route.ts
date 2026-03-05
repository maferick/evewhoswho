import { NextRequest, NextResponse } from 'next/server';

import { loadPublishedOrgchart } from '@/lib/config/orgchart';
import { cacheRenderedArtifacts, readCachedArtifact } from '@/lib/render';

export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get('hash') ?? undefined;
  const cached = await readCachedArtifact('svg', hash);

  if (cached) {
    const immutable = Boolean(hash);
    return new NextResponse(new Uint8Array(cached), {
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=15, stale-while-revalidate=30',
        ...(hash ? { 'content-disposition': `inline; filename=\"chart.${hash}.svg\"` } : {}),
      },
    });
  }

  if (hash) {
    return NextResponse.json({ ok: false, error: 'Artifact not found for requested hash' }, { status: 404 });
  }

  const published = await loadPublishedOrgchart();
  const artifact = await cacheRenderedArtifacts(published);

  return new NextResponse(artifact.svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=15, stale-while-revalidate=30',
      etag: `"${artifact.hash}"`,
      'x-chart-hash': artifact.hash,
    },
  });
}
