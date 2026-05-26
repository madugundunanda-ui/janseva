export interface DashboardStatusBreakdown {
  submitted: number;
  assigned: number;
  in_progress: number;
  resolved: number;
  escalated: number;
}

export interface DashboardStats {
  totalComplaints: number;
  complaintsResolved: number;
  pendingComplaints: number;
  activeDepartments: number;
  slaSuccessRate: number;
  statusBreakdown: DashboardStatusBreakdown;
  averageResolutionTime?: number;
  liveAlerts?: number;
  citizenEngagement?: number;
}

export interface DashboardSnapshot {
  stats: DashboardStats;
  generatedAt: string;
}
