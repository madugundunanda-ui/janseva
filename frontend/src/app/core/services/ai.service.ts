import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {
  AiResult,
  DuplicateDetectionResult,
  ResolutionPredictionResult,
  SeverityAnalysisResult,
} from '../models/ai-result.model';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly apiUrl = environment.apiUrl;
  public pipelineProgress = signal<number>(0);
  public classificationStatus = signal<string>('IDLE');

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  private buildApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiUrl}${normalizedPath}`;
  }

  private extractJobId(response: any): string | null {
    return response?.jobId || response?.data?.jobId || response?.job?.id || response?.analysisId || null;
  }

  private normalizeJobStatus(response: any): any {
    const payload = response.complaint || response;
    const rawStatus =
      response?.status ||
      payload?.verificationStatus ||
      payload?.aiVerification?.verificationStatus ||
      '';

    return {
      ...response,
      verificationStatus: rawStatus,
      department: payload.department,
      category: payload.category || payload.title,
      title: payload.title || response?.title,
      description: payload.description || response?.description,
      priority: payload.priority || response?.priority,
      confidence: payload.confidence ?? payload.aiVerification?.confidenceScore ?? 0,
    };
  }

  private isTerminalSuccess(status: string): boolean {
    const normalizedStatus = String(status || '').toLowerCase();
    return normalizedStatus === 'verified' || normalizedStatus === 'completed';
  }

  private isTerminalFailure(status: string): boolean {
    const normalizedStatus = String(status || '').toLowerCase();
    return normalizedStatus === 'failed' || normalizedStatus === 'rejected';
  }

  private pollJobStatus(jobId: string): Observable<AiResult> {
    return timer(0, 2000).pipe(
      switchMap(() => {
        const token = this.authService.getJwtToken();
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<any>(this.buildApiUrl(`/ai/status/${jobId}`), { headers });
      }),
      map((response) => this.normalizeJobStatus(response)),
      tap((response) => {
        if (this.isTerminalFailure(response.verificationStatus)) {
          throw new Error('AI background categorization failed');
        }
      }),
      filter((response) => this.isTerminalSuccess(response.verificationStatus)),
      take(1),
      map((response) => {
        this.pipelineProgress.set(100);
        this.classificationStatus.set('DONE');
        return response as AiResult;
      })
    );
  }

  private triggerImageAnalysis(file: File, route = '/ai/analyze'): Observable<AiResult> {
    const formData = new FormData();
    formData.append('image', file, file.name);

    this.pipelineProgress.set(30);
    this.classificationStatus.set('RUNNING');

    const token = this.authService.getJwtToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<AiResult>(this.buildApiUrl(route), formData, { headers }).pipe(
      tap((res) => {
        this.pipelineProgress.set(100);
        this.classificationStatus.set('PROCESSING_BACKGROUND');
        const jobId = this.extractJobId(res);
        if (!jobId) {
          throw new Error('AI job ID missing from response');
        }
      }),
      switchMap((res) => this.pollJobStatus(this.extractJobId(res) as string)),
      catchError((err) => {
        this.classificationStatus.set('FAILED');
        return throwError(() => new Error(err?.message ?? 'Analysis pipeline failed'));
      })
    );
  }

  public uploadAndAnalyze(image: File): Observable<AiResult> {
    return this.triggerImageAnalysis(image);
  }

  public analyzeImage(file: File): Observable<AiResult> {
    return this.triggerImageAnalysis(file);
  }

  public analyzeComplaintImage(file: File): Observable<AiResult> {
    return this.analyzeImage(file);
  }

  public getAiHealthStatus(): Observable<any> {
    return this.apiService.get<any>('/ai/health');
  }

  public calculateSeverity(payload: Record<string, unknown>): Observable<SeverityAnalysisResult> {
    return this.apiService.getSeverityAI(payload);
  }

  public predictResolution(payload: Record<string, unknown>): Observable<ResolutionPredictionResult> {
    return this.apiService.predictResolutionAI(payload);
  }

  public detectDuplicate(payload: Record<string, unknown>): Observable<DuplicateDetectionResult> {
    return this.apiService.post<DuplicateDetectionResult>('/ai/spam-detect', payload);
  }

  public verifyResolution(formData: FormData): Observable<unknown> {
    return this.apiService.postForm<unknown>('/ai/verify-resolution', formData);
  }

  public getJobStatus(jobId: string): Observable<any> {
    const token = this.authService.getJwtToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(this.buildApiUrl(`/ai/status/${jobId}`), { headers }).pipe(
      map((response) => this.normalizeJobStatus(response))
    );
  }

  public analyzeImageStream(analysisId: string): Observable<any> {
    if (!analysisId) {
      return throwError(() => new Error('AI job ID missing from response'));
    }

    return this.pollJobStatus(analysisId);
  }
}
