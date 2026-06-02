import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
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
  public pipelineProgress = signal<number>(0);
  public classificationStatus = signal<string>('IDLE');

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  private buildApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${environment.apiUrl}${normalizedPath}`;
  }

  private triggerImageAnalysis(file: File, route = '/ai/analyze'): Observable<AiResult> {
    const formData = new FormData();
    formData.append('image', file, file.name);

    this.pipelineProgress.set(30);
    this.classificationStatus.set('RUNNING');

    return this.http.post<AiResult>(this.buildApiUrl(route), formData).pipe(
      map((res) => {
        this.pipelineProgress.set(100);
        this.classificationStatus.set('PROCESSING_BACKGROUND');
        return res;
      }),
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
    return this.apiService.get<any>(`/ai/job/${jobId}`);
  }

  public analyzeImageStream(analysisId: string): Observable<any> {
    if (!analysisId) {
      return throwError(() => new Error('AI job ID missing from response'));
    }

    return this.getJobStatus(analysisId).pipe(
      map((res: any) => ({
        status: 'completed',
        progress: 100,
        ...(res.complaint || {}),
      }))
    );
  }
}
