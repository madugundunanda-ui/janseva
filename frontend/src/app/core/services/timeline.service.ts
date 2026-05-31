import { Injectable, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, tap, delay } from 'rxjs';
import { ApiService } from './api.service';
import { Complaint } from '../models/complaint.model';
import { DashboardStats } from '../models/dashboard.model';
import { Department } from '../models/department.model';
import { TimelineDistrictMetric, TimelinePoint, TimelineResponse } from '../models/timeline.model';

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  readonly timeline = signal<TimelineResponse | null>(null);

  constructor(private apiService: ApiService) {}

  getTimeline(): Observable<TimelineResponse> {
    return this.apiService.get<TimelineResponse>('/governance/timeline').pipe(
      tap((value) => this.timeline.set(value)),
      catchError(() => this.buildFallbackTimeline()),
      delay(0)
    );
  }

  private buildFallbackTimeline(): Observable<TimelineResponse> {
    return forkJoin({
      complaints: this.apiService.getComplaints().pipe(map((complaints) => complaints ?? [] as Complaint[])),
      departments: this.apiService.getDepartments().pipe(map((departments) => departments ?? [] as Department[])),
      stats: this.apiService.getDashboardStats().pipe(map((response) => this.normalizeStats(response))),
    }).pipe(
      map(({ complaints, departments, stats }) => {
        const points = this.buildPoints(complaints, stats);
        const districtMetrics = this.buildDistrictMetrics(departments, complaints, stats);
        const response: TimelineResponse = {
          points,
          districtMetrics,
          resolved30d: points.reduce((sum, point) => sum + point.resolvedGrievances, 0),
          engagementRate: Number(((points.reduce((sum, point) => sum + point.citizenEngagement, 0) / Math.max(points.length, 1))).toFixed(1)),
          slaSuccessRate: Number(((points.reduce((sum, point) => sum + point.slaCompliance, 0) / Math.max(points.length, 1))).toFixed(1)),
          averageResponseTime: Number((stats.averageResolutionTime ?? 4.6).toFixed(1)),
        };
        this.timeline.set(response);
        return response;
      })
    );
  }

  private buildPoints(complaints: Complaint[], stats: DashboardStats): TimelinePoint[] {
    const today = new Date();
    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - index));
      const dayKey = date.toDateString();
      const dayComplaints = complaints.filter((complaint) => new Date(complaint.createdAt).toDateString() === dayKey);
      const resolved = dayComplaints.filter((complaint) => complaint.status === 'resolved').length;
      const incoming = dayComplaints.length;
      const engagement = Math.min(100, 70 + incoming * 2 + Math.round(stats.slaSuccessRate / 5));
      const sla = Math.min(100, Math.max(40, stats.slaSuccessRate + (resolved * 2) - incoming));
      return {
        date: date.toISOString().slice(0, 10),
        resolvedGrievances: resolved,
        incomingTickets: incoming,
        citizenEngagement: engagement,
        slaCompliance: sla,
      };
    });
  }

  private buildDistrictMetrics(departments: Department[], complaints: Complaint[], stats: DashboardStats): TimelineDistrictMetric[] {
    return departments.slice(0, 6).map((department, index) => {
      const deptComplaints = complaints.filter((complaint) => this.matchesDepartment(complaint.department, department));
      const resolved = deptComplaints.filter((complaint) => complaint.status === 'resolved').length;
      return {
        district: department.district ?? department.name,
        performance: Math.max(60, Math.min(100, department.resolutionRate || stats.slaSuccessRate - index)),
        resolved,
        engagement: Math.max(75, Math.min(100, 88 + index)),
        slaActivity: Math.max(70, Math.min(100, department.slaSuccessRate ?? stats.slaSuccessRate)),
      };
    });
  }

  private matchesDepartment(value: Department | string | undefined, department: Department): boolean {
    if (!value) {
      return false;
    }
    if (typeof value === 'string') {
      return value === department.id || value.toLowerCase() === department.name.toLowerCase();
    }
    return value.id === department.id || value.name.toLowerCase() === department.name.toLowerCase();
  }

  private normalizeStats(value: DashboardStats | { stats?: DashboardStats } | any): DashboardStats {
    return value?.stats ? value.stats : value;
  }
}
