import { getPublicConfig, hasPublishedOrgchart } from '@/lib/config/orgchart';

export default async function ChartPage() {
  const config = getPublicConfig();
  const hasPublished = await hasPublishedOrgchart();

  return (
    <section className="page-shell">
      <div className="panel">
        <p className="eyebrow">Live org chart</p>
        <h1>{config.chartTitle}</h1>
        <p className="muted">Auto-refresh target: every {config.refreshIntervalSeconds} seconds.</p>
      </div>

      <figure className="panel chart-panel">
        <img
          src="/api/chart.svg"
          alt={`${config.chartTitle} example chart`}
          className="chart-image"
        />
        {!hasPublished ? (
          <figcaption className="muted">
            Default sample data is rendered until an admin publishes updated chart data.
          </figcaption>
        ) : null}
      </figure>
    </section>
  );
}
