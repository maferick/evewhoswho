import { NextRequest, NextResponse } from 'next/server';

import { loadPublishedOrgchart } from '@/lib/config/orgchart';
import { cacheRenderedArtifacts, readCachedArtifact } from '@/lib/render';

export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get('hash') ?? undefined;
  const cached = await readCachedArtifact('png', hash);

  if (cached) {
    const immutable = Boolean(hash);
    return new NextResponse(cached, {
      headers: {
        'content-type': 'image/png',
        'cache-control': immutable
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=15, stale-while-revalidate=30',
        ...(hash ? { 'content-disposition': `inline; filename="chart.${hash}.png"` } : {}),
      },
    });
  }

  if (hash) {
    return NextResponse.json({ ok: false, error: 'Artifact not found for requested hash' }, { status: 404 });
  }

  const published = await loadPublishedOrgchart();
  const artifact = await cacheRenderedArtifacts(published);

  if (!artifact.png) {
    return NextResponse.json(
      { ok: false, error: 'PNG rendering unavailable. Install sharp to enable chart PNG output.' },
      { status: 501 },
    );
  }

  return new NextResponse(artifact.png, {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=15, stale-while-revalidate=30',
      etag: `"${artifact.hash}"`,
      'x-chart-hash': artifact.hash,
    },
  });
}
