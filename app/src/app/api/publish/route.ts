import { NextRequest, NextResponse } from 'next/server';

import type { PublishRequest } from '@/lib/types';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as PublishRequest;

  return NextResponse.json({
    ok: true,
    publishedBy: body.publishedBy,
    nodeCount: body.chart.nodes.length,
  });
}
