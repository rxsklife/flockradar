export interface EntitySummary {
  id: string;
  name: string;
  entityType: string;
  city: string | null;
  county: string | null;
  state: string;
  programStatus: string;
  vendor: string;
}

export interface DeploymentWithEntity {
  id: string;
  entityId: string;
  entityName: string;
  entityType: string;
  city: string | null;
  county: string | null;
  state: string;
  systemType: string;
  status: string;
  cameraCount: number | null;
  contractValue: string | null;
  retentionPeriod: string | null;
  sharingNotes: string | null;
  policyUrl: string | null;
  lastVerifiedAt: string | null;
}

export interface SourceSummary {
  url: string;
  sourceType: string;
  publisher: string | null;
  title: string | null;
}

export interface MarkerProperties {
  id: string;
  deploymentId: string;
  entityName: string;
  entityType: string;
  state: string;
  status: string;
  vendor: string;
  precisionLevel: string;
  facingDirection: number | null;
  locationStatus: string;
  description: string | null;
  lastVerifiedAt: string | null;
  cameraCount: number | null;
  retentionPeriod: string | null;
  contractValue: string | null;
  confidence: 'high' | 'medium' | 'low';
  sources: SourceSummary[];
  isExactLocation: boolean;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: MarkerProperties;
}

export interface LocationGeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface ChangelogEntry {
  id: string;
  entityName: string;
  action: string;
  description: string;
  createdAt: string;
}
