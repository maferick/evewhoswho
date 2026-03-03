import { NextResponse } from 'next/server';

import { getPublicConfig } from '@/lib/config';

export async function GET() {
  return NextResponse.json(getPublicConfig());
}
