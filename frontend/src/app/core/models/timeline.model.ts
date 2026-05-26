export interface TimelinePoint {
  date: string;
  resolvedGrievances: number;
  incomingTickets: number;
  citizenEngagement: number;
  slaCompliance: number;
}

export interface TimelineDistrictMetric {
  district: string;
  performance: number;
  resolved: number;
  engagement: number;
  slaActivity: number;
}

export interface TimelineResponse {
  points: TimelinePoint[];
  districtMetrics: TimelineDistrictMetric[];
  resolved30d: number;
  engagementRate: number;
  slaSuccessRate: number;
  averageResponseTime: number;
}
