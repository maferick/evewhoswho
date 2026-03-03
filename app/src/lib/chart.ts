import type { ChartRenderPayload } from '@/lib/types';

export function getSampleChart(): ChartRenderPayload {
  return {
    nodes: [
      { id: '1', label: 'Alice', x: 40, y: 60 },
      { id: '2', label: 'Bob', x: 180, y: 60 },
    ],
    edges: [{ id: 'e1', sourceId: '1', targetId: '2' }],
    generatedAt: new Date().toISOString(),
  };
}
