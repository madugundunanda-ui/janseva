import { Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Complaint } from '../models/complaint.model';
import { Department } from '../models/department.model';
import { DashboardStats } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DepartmentsService {
  readonly departments = signal<Department[]>([]);

  constructor(private apiService: ApiService) {}

  loadDepartments(): Observable<Department[]> {
    return forkJoin({
      departments: this.apiService.getDepartments(),
      complaints: this.apiService.getComplaints().pipe(map((complaints) => complaints ?? [] as Complaint[])),
      stats: this.apiService.getDashboardStats().pipe(map((value) => this.normalizeStats(value))),
    }).pipe(
      map(({ departments, complaints, stats }) => this.enrichDepartments(departments, complaints, stats)),
      tap((items) => this.departments.set(items))
    );
  }

  getDepartmentRoster(): Observable<Department[]> {
    const cached = this.departments();
    if (cached.length > 0) {
      return of(cached);
    }
    return this.loadDepartments();
  }

  private enrichDepartments(departments: Department[], complaints: Complaint[], stats: DashboardStats): Department[] {
    return departments.map((department, index) => {
      const deptComplaints = complaints.filter((complaint) => this.matchesDepartment(complaint.department, department));
      const activeComplaints = deptComplaints.filter((complaint) => complaint.status !== 'resolved').length;
      const resolvedComplaints = deptComplaints.filter((complaint) => complaint.status === 'resolved').length;
      const resolutionRate = deptComplaints.length > 0
        ? Math.round((resolvedComplaints / deptComplaints.length) * 100)
        : Math.round(stats.slaSuccessRate);
      const avgResponseTime = deptComplaints.length > 0
        ? Number((deptComplaints.reduce((sum, complaint) => sum + this.calculateHoursSince(complaint.createdAt), 0) / deptComplaints.length).toFixed(1))
        : Number((stats.averageResolutionTime ?? 4.2).toFixed(1));
      const workloadScore = activeComplaints * 2 + Math.max(0, 100 - resolutionRate);
      const liveStatus = this.deriveStatus(activeComplaints, resolutionRate, index);

      return {
        ...department,
        activeComplaints,
        resolvedComplaints,
        resolutionRate,
        avgResponseTime,
        liveStatus,
        workloadScore,
        slaSuccessRate: resolutionRate,
        lastUpdated: new Date().toISOString(),
      };
    });
  }

  private matchesDepartment(departmentValue: Department | string | undefined, target: Department): boolean {
    if (!departmentValue) {
      return false;
    }
    if (typeof departmentValue === 'string') {
      return departmentValue === target.id || departmentValue.toLowerCase() === target.name.toLowerCase();
    }
    return departmentValue.id === target.id || departmentValue.name.toLowerCase() === target.name.toLowerCase();
  }

  private calculateHoursSince(timestamp: string): number {
    const createdAt = new Date(timestamp).getTime();
    if (Number.isNaN(createdAt)) {
      return 0;
    }
    return Math.max(0, (Date.now() - createdAt) / 36e5);
  }

  private deriveStatus(activeComplaints: number, resolutionRate: number, index: number): Department['liveStatus'] {
    if (activeComplaints > 25 || resolutionRate < 70) {
      return 'alert';
    }
    if (activeComplaints > 10 || resolutionRate < 85) {
      return index % 2 === 0 ? 'congested' : 'maintenance';
    }
    return 'operational';
  }

  private normalizeStats(value: DashboardStats | { stats?: DashboardStats } | any): DashboardStats {
    return 'stats' in value && value.stats ? value.stats : value;
  }
}
