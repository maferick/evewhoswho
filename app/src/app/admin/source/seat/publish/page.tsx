'use client';

import { useEffect, useState } from 'react';

export default function SeatPublishPage() {
  const [previewSummary, setPreviewSummary] = useState('Loading preview...');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/seat/preview', { cache: 'no-store' });
      const payload = (await response.json()) as { ok: boolean; mappedRoles?: number; users?: number; error?: string };
      if (!response.ok || !payload.ok) {
        setPreviewSummary(payload.error ?? 'Unable to load preview');
        return;
      }

      setPreviewSummary(`Mapped roles: ${payload.mappedRoles} | Users: ${payload.users}`);
    };

    void load();
  }, []);

  const publish = async () => {
    setStatus('Publishing...');
    const response = await fetch('/api/seat/publish', { method: 'POST' });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    setStatus(response.ok && payload.ok ? 'Published.' : `Failed: ${payload.error ?? 'unknown error'}`);
  };

  return (
    <section>
      <h1>SeAT Publish</h1>
      <p>{previewSummary}</p>
      <button type="button" onClick={() => void publish()}>Publish chart</button>
      <p>{status}</p>
    </section>
  );
}
