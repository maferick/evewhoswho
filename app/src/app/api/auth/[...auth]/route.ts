import { NextRequest, NextResponse } from 'next/server';

import { getDefaultSession } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: { auth?: string[] } },
) {
  return NextResponse.json({
    path: params.auth ?? [],
    session: getDefaultSession(),
  });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { auth?: string[] } },
) {
  return NextResponse.json({
    ok: true,
    action: params.auth?.[0] ?? 'unknown',
  });
}
