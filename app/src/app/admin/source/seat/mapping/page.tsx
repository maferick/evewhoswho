'use client';

import { useEffect, useState } from 'react';

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

export default function SeatMappingPage() {
  const [mappingRaw, setMappingRaw] = useState('');
  const [status, setStatus] = useState('');
  const [roles, setRoles] = useState<SeatRole[]>([]);

  useEffect(() => {
    const load = async () => {
      const [mappingRes, previewRes] = await Promise.all([
        fetch('/api/seat/mapping', { cache: 'no-store' }),
        fetch('/api/seat/preview', { cache: 'no-store' }),
      ]);

      const mappingPayload = (await mappingRes.json()) as { ok: boolean; data?: MappingPayload; error?: string };
      if (!mappingRes.ok || !mappingPayload.ok || !mappingPayload.data) {
        setStatus(mappingPayload.error ?? 'Unable to load mapping');
        return;
      }

      setMappingRaw(JSON.stringify(mappingPayload.data, null, 2));

      const previewPayload = (await previewRes.json()) as { ok: boolean; preview?: { nodes?: { roles?: unknown[] } }; error?: string; rolesList?: SeatRole[] };
      if (previewRes.ok && previewPayload.ok && previewPayload.rolesList) {
        setRoles(previewPayload.rolesList);
      }
    };

    void load();
  }, []);

  const save = async () => {
    setStatus('Saving mapping...');
    const parsed = JSON.parse(mappingRaw) as MappingPayload;
    const response = await fetch('/api/seat/mapping', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed),
    });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    setStatus(response.ok && payload.ok ? 'Mapping saved.' : `Failed: ${payload.error ?? 'unknown error'}`);
  };

  return (
    <section>
      <h1>SeAT Mapping Editor</h1>
      <p>Define roleMappings, includeRoles, and roleBuckets.</p>
      <p>Known SeAT roles: {roles.length}</p>
      <ul>
        {roles.slice(0, 20).map((role) => (
          <li key={role.id}>#{role.id} {role.title}</li>
        ))}
      </ul>
      <textarea value={mappingRaw} onChange={(event) => setMappingRaw(event.target.value)} style={{ width: '100%', minHeight: 300 }} />
      <p>
        <button type="button" onClick={() => void save()}>Save Mapping</button>{' '}
        <button
          type="button"
          onClick={async () => {
            const response = await fetch('/api/seat/build', { method: 'POST' });
            const payload = (await response.json()) as { ok: boolean; error?: string };
            setStatus(response.ok && payload.ok ? 'Draft built.' : `Build failed: ${payload.error ?? 'unknown error'}`);
          }}
        >
          Build Draft
        </button>
      </p>
      <p>{status}</p>
    </section>
  );
}
