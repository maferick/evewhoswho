import { describe, expect, test } from 'vitest';

import { getDefaultOrgchart, validateOrgchart } from '@/lib/config/orgchart';

describe('orgchart validation', () => {
  test('accepts default orgchart', async () => {
    const validation = await validateOrgchart(getDefaultOrgchart());
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('rejects duplicate node ids via business checks', async () => {
    const doc = getDefaultOrgchart();
    doc.nodes.roles.push({
      id: doc.nodes.teams[0].id,
      name: 'Duplicate ID',
      teamId: doc.nodes.teams[0].id,
    });

    const validation = await validateOrgchart(doc);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((item) => item.code === 'business:duplicate-node-id')).toBe(true);
  });
});
