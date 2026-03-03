import { NextResponse } from 'next/server';

const oneByOnePngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0B6YkAAAAASUVORK5CYII=';

export async function GET() {
  const pngBuffer = Buffer.from(oneByOnePngBase64, 'base64');

  return new NextResponse(pngBuffer, {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'no-store',
    },
  });
}
