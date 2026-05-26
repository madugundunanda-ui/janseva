import { Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, timer } from 'rxjs';
import { ApiService } from './api.service';
import { GovernanceUpdate, LiveUpdatesResponse } from '../models/update.model';

interface AnnouncementRecord {
  id?: string;
  title?: string;
  description?: string;
  department?: string;
  publishedDate?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UpdatesService {
  readonly liveUpdates = signal<GovernanceUpdate[]>([]);

  constructor(private apiService: ApiService) {}

  getLiveUpdates(): Observable<GovernanceUpdate[]> {
    return this.apiService.get<LiveUpdatesResponse | GovernanceUpdate[]>('/updates/live').pipe(
      map((response) => this.normalizeUpdates(response)),
      catchError(() => this.loadAnnouncementFallback())
    );
  }

  watchLiveUpdates(intervalMs = 15000): Observable<GovernanceUpdate[]> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.getLiveUpdates()),
      map((items) => {
        this.liveUpdates.set(items);
        return items;
      })
    );
  }

  private loadAnnouncementFallback(): Observable<GovernanceUpdate[]> {
    return this.apiService.get<AnnouncementRecord[]>('/announcements').pipe(
      map((records) =>
        records.map((record, index) => ({
          id: record.id ?? `announcement-${index}`,
          timestamp: record.publishedDate ?? record.createdAt ?? new Date().toISOString(),
          department: record.department ?? 'GENERAL GOVERNANCE',
          message: `${record.title ?? 'Operational notice'} - ${record.description ?? ''}`.trim(),
          severity: this.inferSeverity(record),
          source: 'announcements',
          ward: undefined,
        }))
      )
    );
  }

  private normalizeUpdates(value: LiveUpdatesResponse | GovernanceUpdate[]): GovernanceUpdate[] {
    if (Array.isArray(value)) {
      return value;
    }
    return value.items ?? [];
  }

  private inferSeverity(record: AnnouncementRecord): GovernanceUpdate['severity'] {
    const text = `${record.title ?? ''} ${record.description ?? ''}`.toLowerCase();
    if (text.includes('emergency') || text.includes('critical') || text.includes('alert')) {
      return 'critical';
    }
    if (text.includes('warning') || text.includes('maintenance')) {
      return 'warning';
    }
    return 'info';
  }
}
