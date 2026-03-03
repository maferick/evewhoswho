export type AppConfig = {
  chartTitle: string;
  refreshIntervalSeconds: number;
  canPublish: boolean;
};

export type AuthSession = {
  user: {
    id: string;
    email: string;
    role: 'viewer' | 'admin';
  };
  expiresAt: string;
};

export type ChartNode = {
  id: string;
  label: string;
  x: number;
  y: number;
};

export type ChartEdge = {
  id: string;
  sourceId: string;
  targetId: string;
};

export type ChartRenderPayload = {
  nodes: ChartNode[];
  edges: ChartEdge[];
  generatedAt: string;
};

export type PublishRequest = {
  chart: ChartRenderPayload;
  publishedBy: string;
};
