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

export type OrgchartEntity = {
  id: string;
  name: string;
};

export type OrgchartRole = OrgchartEntity & {
  teamId: string;
};

export type OrgchartTeam = OrgchartEntity & {
  directorateId: string;
};

export type OrgchartDirectorate = OrgchartEntity & {
  corporationId: string;
};

export type OrgchartNodes = {
  roles: OrgchartRole[];
  directorates: OrgchartDirectorate[];
  teams: OrgchartTeam[];
  corporations: OrgchartEntity[];
};

export type OrgchartEdge = {
  id: string;
  sourceId: string;
  targetId: string;
};

export type OrgchartDocument = {
  meta: {
    version: number;
    title: string;
    updatedAt: string;
  };
  nodes: OrgchartNodes;
  edges: OrgchartEdge[];
  permissions: {
    adminCharacterIds: number[];
  };
};

export type ValidationErrorItem = {
  path: string;
  message: string;
  code: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationErrorItem[];
};
