import type { AppConfig } from '@/lib/types';

const defaultConfig: AppConfig = {
  chartTitle: 'Eve Who\'s Who',
  refreshIntervalSeconds: 30,
  canPublish: true,
};

export function getPublicConfig(): AppConfig {
  return defaultConfig;
}
