import { describe, expect, test } from 'vitest';

import { getDefaultOrgchart } from '@/lib/config/orgchart';
import { renderOrgchart } from '@/lib/render';

describe('render integration', () => {
  test('known config renders deterministic svg/hash', async () => {
    const config = getDefaultOrgchart();
    config.meta.title = 'Deterministic Chart';
    config.meta.updatedAt = '2024-01-01T00:00:00.000Z';

    const artifact = await renderOrgchart(config);

    expect(artifact.hash).toBe('d94795c6f50f7394');
    expect(artifact.svg).toContain('<svg id="chart-d94795c6f50f7394"');
    expect(artifact.svg).toContain('Deterministic Chart');
    expect(artifact.svg).toContain('id="node-corp-1"');
    expect(artifact.svg).toContain('id="edge-edge-1"');
  });
});
