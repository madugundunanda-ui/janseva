export type UpdateSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface GovernanceUpdate {
  id: string;
  timestamp: string;
  department: string;
  message: string;
  severity: UpdateSeverity;
  ward?: string;
  source?: string;
}

export interface LiveUpdatesResponse {
  items: GovernanceUpdate[];
  lastUpdated: string;
}
