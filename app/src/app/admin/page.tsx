'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { OrgchartDocument, ValidationErrorItem } from '@/lib/types';

type SessionResponse = {
  authenticated: boolean;
  characterName?: string;
  isAdmin?: boolean;
};

export default function AdminPage() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [orgchartRaw, setOrgchartRaw] = useState('');
  const [errors, setErrors] = useState<ValidationErrorItem[]>([]);
  const [status, setStatus] = useState('');

  const chartPreviewUrl = useMemo(() => '/api/chart.svg', []);

  const loadDraft = useCallback(async () => {
    const response = await fetch('/api/config', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to load draft config');
    }

    const payload = (await response.json()) as { data: OrgchartDocument; errors: ValidationErrorItem[] };
    setOrgchartRaw(JSON.stringify(payload.data, null, 2));
    setErrors(payload.errors);
  }, []);

  useEffect(() => {
    const init = async () => {
      const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
      const sessionPayload = (await sessionRes.json()) as SessionResponse;
      setSession(sessionPayload);

      if (sessionPayload.authenticated && sessionPayload.isAdmin) {
        await loadDraft();
      }
    };

    void init();
  }, [loadDraft]);

  const onValidate = async () => {
    setStatus('Validating…');
    const parsed = JSON.parse(orgchartRaw) as OrgchartDocument;
    const response = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed),
    });
    const payload = (await response.json()) as { errors: ValidationErrorItem[] };
    setErrors(payload.errors);
    setStatus(response.ok ? 'Draft saved.' : 'Draft has validation errors.');
  };

  const onPublish = async () => {
    setStatus('Publishing…');
    const response = await fetch('/api/publish', { method: 'POST' });
    const payload = (await response.json()) as { ok: boolean; error?: string; chartHash?: string };
    if (!response.ok || !payload.ok) {
      setStatus(`Publish failed: ${payload.error ?? 'unknown error'}`);
      return;
    }

    setStatus(`Published successfully (hash: ${payload.chartHash}).`);
  };

  if (!session) {
    return <p>Loading session…</p>;
  }

  if (!session.authenticated) {
    return (
      <section>
        <h1>Admin</h1>
        <p>You are not signed in.</p>
        <a href="/api/auth/login">Login with EVE SSO</a>
      </section>
    );
  }

  if (!session.isAdmin) {
    return (
      <section>
        <h1>Admin</h1>
        <p>Signed in as {session.characterName} but not on the publish allowlist.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Admin</h1>
      <p>Signed in as: {session.characterName}</p>
      <p>
        <button type="button" onClick={() => void onValidate()}>
          Save & Validate Draft
        </button>{' '}
        <button type="button" onClick={() => void onPublish()}>
          Publish
        </button>
      </p>
      <p>{status}</p>
      <h2>Draft JSON Editor</h2>
      <textarea
        aria-label="Draft orgchart JSON"
        value={orgchartRaw}
        onChange={(event) => setOrgchartRaw(event.target.value)}
        style={{ width: '100%', minHeight: 320 }}
      />
      <h2>Validation Errors</h2>
      <pre>{errors.length ? JSON.stringify(errors, null, 2) : 'No validation errors'}</pre>
      <h2>Preview</h2>
      <img src={chartPreviewUrl} alt="Chart preview" style={{ maxWidth: '100%' }} />
    </section>
  );
}
