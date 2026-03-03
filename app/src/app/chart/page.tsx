import { getPublicConfig } from '@/lib/config';

export default function ChartPage() {
  const config = getPublicConfig();

  return (
    <section>
      <h1>Public Chart Viewer</h1>
      <p>Chart title: {config.chartTitle}</p>
      <p>Refresh interval: {config.refreshIntervalSeconds}s</p>
    </section>
  );
}
