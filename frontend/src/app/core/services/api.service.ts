import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, throwError, finalize, retry, timer, timeout, TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiResult, ResolutionPredictionResult, SeverityAnalysisResult } from '../models/ai-result.model';
import { Complaint, ComplaintAssignmentOptions, ComplaintUploadResponse } from '../models/complaint.model';
import { DashboardSnapshot, DashboardStats } from '../models/dashboard.model';
import { Department } from '../models/department.model';
import { TimelineResponse } from '../models/timeline.model';
import { User } from '../models/user.model';

export type { AiResult, ResolutionPredictionResult, SeverityAnalysisResult } from '../models/ai-result.model';
export type { Complaint, ComplaintAssignmentOptions, ComplaintUploadResponse } from '../models/complaint.model';
export type { DashboardSnapshot, DashboardStats } from '../models/dashboard.model';
export type { Department } from '../models/department.model';
export type { TimelineResponse } from '../models/timeline.model';
export type { User } from '../models/user.model';

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export interface ApiRequestOptions {
  params?: Record<string, string | number | boolean | null | undefined>;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  readonly apiUrl = environment.apiUrl;
  readonly aiServiceUrl = environment.aiServiceUrl;
  readonly websocketUrl = environment.websocketUrl;

  readonly isOffline = signal<boolean>(typeof window !== 'undefined' ? !navigator.onLine : false);
  readonly isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.isOffline.set(false));
      window.addEventListener('offline', () => this.isOffline.set(true));
    }
  }

  get<T>(path: string, options: ApiRequestOptions = {}): Observable<T> {
    this.isLoading.set(true);
    return this.http.get<ApiEnvelope<T> | T>(this.buildUrl(path), {
      params: this.toParams(options.params),
      withCredentials: true
    }).pipe(
      timeout(10000),
      map((response) => this.unwrap<T>(response)),
      retry({
        count: 2,
        delay: (error, retryCount) => {
          // Only retry on 5xx server errors or network failures (status 0)
          const status = error?.status ?? 0;
          if (status > 0 && status < 500) {
            return throwError(() => error);
          }
          return timer(retryCount * 1000);
        }
      }),
      catchError(this.handleError(path)),
      finalize(() => this.isLoading.set(false))
    );
  }

  post<T>(path: string, body: unknown, options: ApiRequestOptions = {}): Observable<T> {
    this.isLoading.set(true);
    return this.http.post<ApiEnvelope<T> | T>(this.buildUrl(path), body, {
      params: this.toParams(options.params),
      withCredentials: true
    }).pipe(
      timeout(10000),
      map((response) => this.unwrap<T>(response)),
      catchError(this.handleError(path)),
      finalize(() => this.isLoading.set(false))
    );
  }

  put<T>(path: string, body: unknown, options: ApiRequestOptions = {}): Observable<T> {
    this.isLoading.set(true);
    return this.http.put<ApiEnvelope<T> | T>(this.buildUrl(path), body, {
      params: this.toParams(options.params),
      withCredentials: true
    }).pipe(
      timeout(10000),
      map((response) => this.unwrap<T>(response)),
      catchError(this.handleError(path)),
      finalize(() => this.isLoading.set(false))
    );
  }

  patch<T>(path: string, body: unknown, options: ApiRequestOptions = {}): Observable<T> {
    this.isLoading.set(true);
    return this.http.patch<ApiEnvelope<T> | T>(this.buildUrl(path), body, {
      params: this.toParams(options.params),
      withCredentials: true
    }).pipe(
      timeout(10000),
      map((response) => this.unwrap<T>(response)),
      catchError(this.handleError(path)),
      finalize(() => this.isLoading.set(false))
    );
  }

  delete<T>(path: string, options: ApiRequestOptions = {}): Observable<T> {
    this.isLoading.set(true);
    return this.http.delete<ApiEnvelope<T> | T>(this.buildUrl(path), {
      params: this.toParams(options.params),
      withCredentials: true
    }).pipe(
      timeout(10000),
      map((response) => this.unwrap<T>(response)),
      catchError(this.handleError(path)),
      finalize(() => this.isLoading.set(false))
    );
  }

  postForm<T>(path: string, body: FormData, options: ApiRequestOptions = {}): Observable<T> {
    this.isLoading.set(true);
    return this.http.post<ApiEnvelope<T> | T>(this.buildUrl(path), body, {
      params: this.toParams(options.params),
      withCredentials: true
    }).pipe(
      timeout(10000),
      map((response) => this.unwrap<T>(response)),
      catchError(this.handleError(path)),
      finalize(() => this.isLoading.set(false))
    );
  }

  // Domain endpoints kept here as a compatibility layer for existing feature components.
  getDashboardStats(): Observable<DashboardSnapshot | DashboardStats> {
    return this.get<DashboardSnapshot | DashboardStats>('/dashboard/stats').pipe(
      catchError(() => of(this.createFallbackDashboardStats()))
    );
  }

  getDepartments(): Observable<Department[]> {
    return this.get<{ count: number; departments: Department[] }>('/departments').pipe(
      map((response) => response.departments || []),
      catchError(() => of([]))
    );
  }

  getComplaints(params?: Record<string, string | number | boolean | null | undefined>): Observable<Complaint[]> {
    return this.get<{ count: number; complaints: Complaint[] }>('/complaints', { params }).pipe(
      map((response) => response.complaints || []),
      catchError(() => of([]))
    );
  }

  getComplaintById(id: string): Observable<Complaint> {
    return this.get<{ complaint: Complaint }>(`/complaints/${id}`).pipe(
      map((response) => response.complaint),
      catchError(() => of(this.createFallbackComplaint(id)))
    );
  }

  createComplaint(formData: FormData): Observable<Complaint> {
    return this.postForm<{ complaint: Complaint }>('/complaints', formData).pipe(
      map((response) => response.complaint)
    );
  }

  uploadComplaintImages(formData: FormData): Observable<ComplaintUploadResponse> {
    return this.postForm<ComplaintUploadResponse>('/complaints/upload', formData);
  }

  assignOfficer(complaintId: string, officerId: string): Observable<Complaint> {
    return this.patch<{ complaint: Complaint }>(`/complaints/${complaintId}/assign-officer`, { officerId }).pipe(
      map((response) => response.complaint)
    );
  }

  escalateComplaint(complaintId: string, supervisorId: string, note: string): Observable<Complaint> {
    return this.patch<{ complaint: Complaint }>(`/complaints/${complaintId}/assign-supervisor`, { supervisorId, note }).pipe(
      map((response) => response.complaint)
    );
  }

  uploadResolutionProof(complaintId: string, formData: FormData): Observable<unknown> {
    return this.patch<unknown>(`/complaints/${complaintId}`, formData);
  }

  analyzeImageAI(file: File): Observable<AiResult> {
    const formData = new FormData();
    formData.append('image', file);
    return this.postForm<AiResult>('/ai/analyze', formData);
  }

  getSeverityAI(payload: Record<string, unknown>): Observable<SeverityAnalysisResult> {
    return this.post<SeverityAnalysisResult>('/ai/severity', payload);
  }

  predictResolutionAI(payload: Record<string, unknown>): Observable<ResolutionPredictionResult> {
    return this.post<ResolutionPredictionResult>('/ai/predict-resolution', payload);
  }

  getAssignmentOptions(complaintId: string): Observable<ComplaintAssignmentOptions> {
    return this.get<ComplaintAssignmentOptions>(`/complaints/${complaintId}/assignment-options`);
  }

  getUsers(role?: string, department?: string): Observable<User[]> {
    return this.get<{ count: number; users: User[] }>('/users', {
      params: {
        role,
        department,
      },
    }).pipe(
      map((response) => response.users || []),
      catchError(() => of([]))
    );
  }

  getAnnouncements(): Observable<unknown[]> {
    return this.get<{ count: number; announcements: unknown[] }>('/announcements').pipe(
      map((response) => response.announcements || []),
      catchError(() => of([]))
    );
  }

  getTimeline(): Observable<TimelineResponse> {
    return this.get<TimelineResponse>('/governance/timeline').pipe(
      catchError(() => of(this.createFallbackTimeline()))
    );
  }

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiUrl}${normalizedPath}`;
  }

  private toParams(params?: ApiRequestOptions['params']): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return;
      }
      httpParams = httpParams.set(key, String(value));
    });
    return httpParams;
  }

  private unwrap<T>(response: ApiEnvelope<T> | T): T {
    if (response && typeof response === 'object' && 'data' in response) {
      const envelope = response as ApiEnvelope<T>;
      if (envelope.data !== undefined) {
        return envelope.data as T;
      }
    }
    return response as T;
  }

  private handleError(path: string) {
    return (error: any) => {
      if (error instanceof TimeoutError) {
        (error as any).friendlyMessage = 'Connection to the server timed out. Please try again.';
        return throwError(() => error);
      }

      // Preserve the original HttpErrorResponse so callers can inspect status/code
      // but ensure there's a readable message available.
      if (error && typeof error === 'object') {
        try {
          if (error.status === 0) {
            error.friendlyMessage = 'Server is unreachable. Please check your connection or try again later.';
          } else {
            const message = error.error?.message || error.message || `Request failed for ${path}`;
            error.friendlyMessage = message;
          }
        } catch {
          // ignore
        }
      }
      return throwError(() => error);
    };
  }

  private createFallbackDashboardStats(): DashboardStats {
    return {
      totalComplaints: 0,
      complaintsResolved: 0,
      pendingComplaints: 0,
      activeDepartments: 0,
      slaSuccessRate: 0,
      statusBreakdown: {
        submitted: 0,
        assigned: 0,
        in_progress: 0,
        resolved: 0,
        escalated: 0,
      },
      averageResolutionTime: 0,
      liveAlerts: 0,
      citizenEngagement: 0,
    };
  }

  private createFallbackComplaint(id: string): Complaint {
    return {
      id,
      title: 'Pending civic intake',
      description: 'Complaint details are unavailable while the backend is offline.',
      location: {
        address: 'Unknown location',
        ward: 'WARD-00',
      },
      department: 'General Operations',
      severity: 'medium',
      priority: 'medium',
      status: 'submitted',
      createdAt: new Date().toISOString(),
      images: [],
      logs: [],
    };
  }

  private createFallbackTimeline(): TimelineResponse {
    return {
      points: [],
      districtMetrics: [],
      resolved30d: 0,
      engagementRate: 0,
      slaSuccessRate: 0,
      averageResponseTime: 0,
    };
  }
}
