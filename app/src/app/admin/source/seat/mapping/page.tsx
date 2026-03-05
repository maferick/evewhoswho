'use client';

import { useEffect, useMemo, useState } from 'react';

type MappingPayload = {
  roleMappings: Record<string, string>;
  includeRoles: number[];
  roleBuckets: Record<string, number[]>;
};

type SeatRole = {
  id: number;
  title: string;
  description: string;
};

type MappingState = {
  includeRoles: Set<number>;
  roleMappings: Record<string, string>;
  roleBucketByRole: Record<string, string>;
};

const ORG_NODE_OPTIONS = [
  { id: 'chief_gardeners', label: 'Chief Gardeners' },
  { id: 'grol_lake_advisory', label: 'Grol Lake Advisory' },
  { id: 'director_comms', label: 'Director - Communications' },
  { id: 'director_finance', label: 'Director - Finance' },
  { id: 'director_industry', label: 'Director - Industry' },
  { id: 'director_logistics', label: 'Director - Logistics' },
  { id: 'director_war', label: 'Director - War' },
  { id: 'srp_team', label: 'SRP Team' },
  { id: 'diplomacy_team', label: 'Diplomacy Team' },
  { id: 'it_team', label: 'IT Team' },
] as const;

const BUCKET_OPTIONS = [
  { id: 'seat_general', label: 'General' },
  { id: 'comms_team', label: 'Comms Team' },
  { id: 'finance_team', label: 'Finance Team' },
  { id: 'industry_team', label: 'Industry Team' },
  { id: 'logistics_team', label: 'Logistics Team' },
  { id: 'war_team', label: 'War Team' },
  { id: 'diplomacy_team', label: 'Diplomacy Team' },
  { id: 'it_team', label: 'IT Team' },
] as const;

function hydrateMappingState(mapping: MappingPayload): MappingState {
  const roleBucketByRole: Record<string, string> = {};
  Object.entries(mapping.roleBuckets).forEach(([bucketKey, roleIds]) => {
    roleIds.forEach((roleId) => {
      roleBucketByRole[String(roleId)] = bucketKey;
    });
  });

  return {
    includeRoles: new Set(mapping.includeRoles),
    roleMappings: { ...mapping.roleMappings },
    roleBucketByRole,
  };
}

function toPayload(state: MappingState): MappingPayload {
  const includeRoles = new Set<number>(state.includeRoles);

  Object.keys(state.roleBucketByRole).forEach((roleId) => {
    const bucketKey = state.roleBucketByRole[roleId];
    if (bucketKey) {
      includeRoles.add(Number(roleId));
    }
  });

  const roleBuckets: Record<string, number[]> = {};
  Object.entries(state.roleBucketByRole).forEach(([roleId, bucketKey]) => {
    if (!bucketKey) {
      return;
    }
    roleBuckets[bucketKey] ??= [];
    roleBuckets[bucketKey].push(Number(roleId));
  });

  Object.values(roleBuckets).forEach((values) => values.sort((a, b) => a - b));

  const roleMappings: Record<string, string> = {};
  Object.entries(state.roleMappings).forEach(([roleId, nodeId]) => {
    if (nodeId) {
      roleMappings[roleId] = nodeId;
    }
  });

  return {
    includeRoles: [...includeRoles].sort((a, b) => a - b),
    roleMappings,
    roleBuckets,
  };
}

export default function SeatMappingPage() {
  const [state, setState] = useState<MappingState>({
    includeRoles: new Set<number>(),
    roleMappings: {},
    roleBucketByRole: {},
  });
  const [status, setStatus] = useState('');
  const [roles, setRoles] = useState<SeatRole[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      const [mappingRes, rolesRes] = await Promise.all([
        fetch('/api/seat/mapping', { cache: 'no-store' }),
        fetch('/api/seat/roles', { cache: 'no-store' }),
      ]);

      const mappingPayload = (await mappingRes.json()) as { ok: boolean; data?: MappingPayload; error?: string };
      if (!mappingRes.ok || !mappingPayload.ok || !mappingPayload.data) {
        setStatus(mappingPayload.error ?? 'Unable to load mapping');
        return;
      }

      const rolesPayload = (await rolesRes.json()) as { ok: boolean; data?: SeatRole[]; error?: string };
      if (!rolesRes.ok || !rolesPayload.ok || !rolesPayload.data) {
        setStatus(rolesPayload.error ?? 'Unable to load roles. Run sync first.');
        return;
      }

      setState(hydrateMappingState(mappingPayload.data));
      setRoles(rolesPayload.data);
    };

    void load();
  }, []);

  const filteredRoles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return roles;
    }

    return roles.filter((role) => role.title.toLowerCase().includes(normalized));
  }, [query, roles]);

  const summary = useMemo(() => {
    const included = roles.filter((role) => state.includeRoles.has(role.id));
    const mapped = included.filter((role) => Boolean(state.roleMappings[String(role.id)]));

    return {
      included: included.length,
      mapped: mapped.length,
      unmapped: included.length - mapped.length,
    };
  }, [roles, state.includeRoles, state.roleMappings]);

  const setIncluded = (roleId: number, include: boolean) => {
    setState((previous) => {
      const nextInclude = new Set(previous.includeRoles);
      if (include) {
        nextInclude.add(roleId);
      } else {
        nextInclude.delete(roleId);
      }
      return {
        ...previous,
        includeRoles: nextInclude,
      };
    });
  };

  const save = async () => {
    setStatus('Saving mapping...');
    const payload = toPayload(state);

    const response = await fetch('/api/seat/mapping', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { ok: boolean; error?: string };
    setStatus(response.ok && result.ok ? 'Mapping saved.' : `Failed: ${result.error ?? 'unknown error'}`);
  };

  const buildDraft = async () => {
    if (summary.unmapped > 0) {
      setStatus('Build blocked: all included roles must be mapped to an org node first.');
      return;
    }

    const response = await fetch('/api/seat/build', { method: 'POST' });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    setStatus(response.ok && payload.ok ? 'Draft built.' : `Build failed: ${payload.error ?? 'unknown error'}`);
  };

  return (
    <section>
      <h1>SeAT Mapping Editor</h1>
      <p>Map included SeAT roles to org nodes and optional buckets.</p>

      <p>
        <strong>Summary:</strong>{' '}
        Included roles: {summary.included} · Mapped roles: {summary.mapped} · Unmapped included roles: {summary.unmapped}
      </p>

      {summary.unmapped > 0 ? (
        <p style={{ background: '#2b110b', border: '1px solid #7f1d1d', padding: 8, borderRadius: 6 }}>
          Warning: {summary.unmapped} included role(s) are missing a mapped node. Save is allowed, but Build Draft is blocked.
        </p>
      ) : null}

      <p>
        <input
          type="search"
          placeholder="Search role title"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ minWidth: 260 }}
        />{' '}
        <button
          type="button"
          onClick={() => {
            setState((previous) => ({ ...previous, includeRoles: new Set(roles.map((role) => role.id)) }));
          }}
        >
          Select all
        </button>{' '}
        <button
          type="button"
          onClick={() => {
            setState((previous) => ({ ...previous, includeRoles: new Set<number>() }));
          }}
        >
          Clear
        </button>
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Include</th>
              <th align="left">Role ID</th>
              <th align="left">Role Title</th>
              <th align="left">Mapped Node</th>
              <th align="left">Bucket (optional)</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((role) => {
              const roleKey = String(role.id);
              const included = state.includeRoles.has(role.id);

              return (
                <tr key={role.id} style={{ borderTop: '1px solid #334155' }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={(event) => setIncluded(role.id, event.target.checked)}
                    />
                  </td>
                  <td>{role.id}</td>
                  <td>{role.title}</td>
                  <td>
                    <select
                      value={state.roleMappings[roleKey] ?? ''}
                      disabled={!included}
                      onChange={(event) => {
                        const nodeId = event.target.value;
                        setState((previous) => ({
                          ...previous,
                          roleMappings: {
                            ...previous.roleMappings,
                            [roleKey]: nodeId,
                          },
                        }));
                      }}
                    >
                      <option value="">Unmapped</option>
                      {ORG_NODE_OPTIONS.map((node) => (
                        <option key={node.id} value={node.id}>{node.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={state.roleBucketByRole[roleKey] ?? ''}
                      onChange={(event) => {
                        const bucketKey = event.target.value;
                        setState((previous) => ({
                          ...previous,
                          roleBucketByRole: {
                            ...previous.roleBucketByRole,
                            [roleKey]: bucketKey,
                          },
                        }));
                      }}
                    >
                      <option value="">No bucket</option>
                      {BUCKET_OPTIONS.map((bucket) => (
                        <option key={bucket.id} value={bucket.id}>{bucket.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p>
        <button type="button" onClick={() => void save()}>Save Mapping</button>{' '}
        <button type="button" disabled={summary.unmapped > 0} onClick={() => void buildDraft()}>
          Build Draft
        </button>
      </p>
      <p>{status}</p>
    </section>
  );
}
