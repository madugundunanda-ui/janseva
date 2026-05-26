export type DepartmentStatus = 'operational' | 'congested' | 'alert' | 'maintenance';

export interface Department {
  id: string;
  name: string;
  description?: string;
  activeComplaints: number;
  resolvedComplaints: number;
  resolutionRate: number;
  avgResponseTime: number;
  liveStatus: DepartmentStatus;
  responseTrend?: number;
  workloadScore?: number;
  slaSuccessRate?: number;
  lastUpdated?: string;
  district?: string;
}
