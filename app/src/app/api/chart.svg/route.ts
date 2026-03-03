import { NextResponse } from 'next/server';

import { getSampleChart } from '@/lib/chart';

export async function GET() {
  const chart = getSampleChart();
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="280" height="140" viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg">
  <rect width="280" height="140" fill="#111827"/>
  <line x1="75" y1="60" x2="180" y2="60" stroke="#9ca3af" stroke-width="2"/>
  ${chart.nodes
    .map(
      (node) =>
        `<circle cx="${node.x}" cy="${node.y}" r="30" fill="#2563eb"/><text x="${node.x}" y="${node.y + 5}" text-anchor="middle" fill="#fff" font-size="12">${node.label}</text>`,
    )
    .join('\n  ')}
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
