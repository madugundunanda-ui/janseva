import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CivicHealthScore {
  _id: string;
  level: string;
  areaName: string;
  score: number;
  status: string;
  metrics: any;
  calculationDate: Date;
}

export interface DepartmentPerformance {
  _id: string;
  departmentName: string;
  metrics: any;
}

export interface OfficerPerformance {
  _id: string;
  officerName: string;
  departmentName: string;
  performanceScore: number;
  metrics: any;
}

export interface SlaMetric {
  _id: string;
  entityType: string;
  metrics: any;
}

export interface RiskAssessment {
  _id: string;
  areaName: string;
  riskType: string;
  riskScore: number;
  riskCategory: string;
  trendDescription: string;
  recommendedAction: string;
}

export interface GovernanceInsight {
  _id: string;
  title: string;
  insightType: string;
  description: string;
  actionableRecommendation?: string;
  severity: string;
  district?: string;
  ward?: string;
  trendPercentage?: number;
  reasoning?: string[];
  confidenceScore: number;
}

export interface Prediction {
  _id: string;
  predictionType: string;
  targetName?: string;
  forecastValue: number;
  forecastUnit?: string;
  forecastPeriod?: string;
  confidenceScore?: number;
  reasoning?: string[];
}

export interface HeatmapData {
  _id: string;
  mapType: string;
  points: { lat: number; lng: number; weight: number }[];
}

export interface ExecutiveDashboardMetric {
  _id: string;
  stateCivicHealthScore: number;
  governanceEffectivenessScore: number;
  governanceCategory: string;
  emergencyRiskIndex: number;
  slaComplianceIndex: number;
  citizenSatisfactionIndex: number;
  aiAccuracyIndex: number;
  topDistricts: { name: string; score: number }[];
  worstDistricts: { name: string; score: number }[];
  topDepartments: { name: string; score: number }[];
  underperformingDepartments: { name: string; score: number }[];
  topOfficers: { name: string; score: number }[];
  criticalRiskAreas: { name: string; score: number }[];
  emergencyHotspots: { name: string; score: number }[];
  calculationDate: Date;
}

export interface ExecutiveGovernanceReport {
  _id: string;
  reportType: string;
  summaryContent: string[];
  generatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  getCivicHealth(): Observable<{ scores: CivicHealthScore[] }> {
    return this.http.get<{ scores: CivicHealthScore[] }>(`${this.apiUrl}/civic-health`);
  }

  getDepartments(): Observable<{ departments: DepartmentPerformance[] }> {
    return this.http.get<{ departments: DepartmentPerformance[] }>(`${this.apiUrl}/departments`);
  }

  getOfficers(): Observable<{ officers: OfficerPerformance[] }> {
    return this.http.get<{ officers: OfficerPerformance[] }>(`${this.apiUrl}/officers`);
  }

  getSla(): Observable<{ slaMetrics: SlaMetric[] }> {
    return this.http.get<{ slaMetrics: SlaMetric[] }>(`${this.apiUrl}/sla`);
  }

  getRisks(): Observable<{ risks: RiskAssessment[] }> {
    return this.http.get<{ risks: RiskAssessment[] }>(`${this.apiUrl}/risks`);
  }

  getGovernanceInsights(): Observable<{ insights: GovernanceInsight[] }> {
    return this.http.get<{ insights: GovernanceInsight[] }>(`${this.apiUrl}/governance-insights`);
  }

  getPredictions(): Observable<{ predictions: Prediction[] }> {
    return this.http.get<{ predictions: Prediction[] }>(`${this.apiUrl}/predictions`);
  }

  getHeatmaps(): Observable<{ heatmaps: HeatmapData[] }> {
    return this.http.get<{ heatmaps: HeatmapData[] }>(`${this.apiUrl}/heatmaps`);
  }

  getExecutiveDashboard(): Observable<{ dashboard: ExecutiveDashboardMetric }> {
    return this.http.get<{ dashboard: ExecutiveDashboardMetric }>(`${this.apiUrl}/executive-dashboard`);
  }

  getExecutiveReports(): Observable<{ reports: ExecutiveGovernanceReport[] }> {
    return this.http.get<{ reports: ExecutiveGovernanceReport[] }>(`${this.apiUrl}/executive-reports`);
  }

  getAiMetrics(): Observable<{ metrics: any }> {
    return this.http.get<{ metrics: any }>(`${this.apiUrl}/ai-metrics`);
  }

  getDashboard(): Observable<{ stats: any }> {
    return this.http.get<{ stats: any }>(`${this.apiUrl}/dashboard`);
  }

  getMaps(): Observable<{ risks: RiskAssessment[], scores: CivicHealthScore[] }> {
    return this.http.get<{ risks: RiskAssessment[], scores: CivicHealthScore[] }>(`${this.apiUrl}/maps`);
  }
}
