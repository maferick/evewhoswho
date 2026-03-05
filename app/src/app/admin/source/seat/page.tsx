'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SeatSourcePage() {
  const [status, setStatus] = useState('');

  const run = async (endpoint: string) => {
    setStatus(`Running ${endpoint}...`);
    const response = await fetch(endpoint, { method: 'POST' });
    const payload = (await response.json()) as { ok?: boolean; error?: string; generatedAt?: string };
    if (!response.ok || !payload.ok) {
      const error = payload.error ?? 'unknown error';
      if (error.includes('Missing required env var: SEAT_BASE_URL') || error.includes('Missing required env var: SEAT_API_KEY')) {
        setStatus(`Failed: ${error}. Add SEAT_BASE_URL and SEAT_API_KEY to your environment, then restart the app.`);
        return;
      }

      setStatus(`Failed: ${error}`);
      return;
    }

    setStatus(`Success: ${endpoint}${payload.generatedAt ? ` @ ${payload.generatedAt}` : ''}`);
  };

  return (
    <section>
      <h1>SeAT Source Control</h1>
      <p>
        <button type="button" onClick={() => void run('/api/seat/test')}>
          Test API Key
        </button>{' '}
        <button type="button" onClick={() => void run('/api/seat/sync')}>
          Sync Data
        </button>
      </p>
      <p>{status}</p>
      <ul>
        <li><Link href="/admin/source/seat/mapping">Mapping Editor</Link></li>
        <li><Link href="/admin/source/seat/publish">Publish</Link></li>
      </ul>
    </section>
  );
}
