import { Injectable, signal } from '@angular/core';
import { map, Observable, of, tap, delay } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardSnapshot, DashboardStats } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  readonly stats = signal<DashboardStats | null>(null);

  constructor(private apiService: ApiService) {}

  loadStats(): Observable<DashboardStats> {
    return this.apiService.getDashboardStats().pipe(
      map((response) => this.normalizeStats(response)),
      tap((stats) => this.stats.set(stats)),
      delay(0)
    );
  }

  getStats(): Observable<DashboardStats> {
    const cached = this.stats();
    if (cached) {
      return of(cached).pipe(delay(0));
    }
    return this.loadStats();
  }

  getSnapshot(): Observable<DashboardSnapshot> {
    return this.getStats().pipe(
      map((stats) => ({
        stats,
        generatedAt: new Date().toISOString(),
      }))
    );
  }

  private normalizeStats(value: any): DashboardStats {
    const rawStats = value?.stats || value || {};
    
    const statusBreakdown = {
      submitted: rawStats.statusBreakdown?.submitted ?? rawStats.pending ?? 0,
      assigned: rawStats.statusBreakdown?.assigned ?? rawStats.inProgress ?? 0,
      in_progress: rawStats.statusBreakdown?.in_progress ?? 0,
      resolved: rawStats.statusBreakdown?.resolved ?? rawStats.resolved ?? 0,
      escalated: rawStats.statusBreakdown?.escalated ?? rawStats.escalated ?? 0
    };

    return {
      totalComplaints: rawStats.totalComplaints ?? rawStats.total ?? 0,
      complaintsResolved: rawStats.complaintsResolved ?? rawStats.resolved ?? 0,
      pendingComplaints: rawStats.pendingComplaints ?? rawStats.pending ?? 0,
      activeDepartments: rawStats.activeDepartments ?? rawStats.totalDepartments ?? 5,
      slaSuccessRate: rawStats.slaSuccessRate ?? 92,
      statusBreakdown: statusBreakdown,
      averageResolutionTime: rawStats.averageResolutionTime ?? 4.2,
      liveAlerts: rawStats.liveAlerts ?? 0,
      citizenEngagement: rawStats.citizenEngagement ?? 85
    };
  }
}
