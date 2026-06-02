import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
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
  /** UI state trackers – they are updated as soon as the request is sent,
   * because the backend now returns a 202 Accepted response and continues
   * processing in the background.
   */
  public pipelineProgress = signal<number>(0);
  public classificationStatus = signal<string>('IDLE');

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  /**
   * Upload an image and trigger the backend "analyze-pipeline" endpoint.
   * The backend responds immediately with **202 Accepted** while the heavy AI
   * work runs in the background. UI signals are set instantly to reflect that
   * the request has been handed off.
   */
  public uploadAndAnalyze(image: File): Observable<AiResult> {
    const formData = new FormData();
    formData.append('image', image, image.name);

    // UI shows that the request is in flight
    this.pipelineProgress.set(30);
    this.classificationStatus.set('RUNNING');

    return this.apiService
      .postForm<any>('/ai/analyze-pipeline', formData)
      .pipe(
        map((res) => {
          // Backend accepted the job – move UI to "background processing"
          this.pipelineProgress.set(100);
          this.classificationStatus.set('PROCESSING_BACKGROUND');
          return res as AiResult;
        }),
        catchError((err) => {
          this.classificationStatus.set('FAILED');
          return throwError(() => new Error(err.message ?? 'Analysis pipeline failed'));
        })
      );
  }

  /** Direct image‑analysis endpoint (kept for compatibility). */
  public analyzeImage(file: File): Observable<AiResult> {
    this.pipelineProgress.set(30);
    this.classificationStatus.set('RUNNING');

    return this.apiService.analyzeImageAI(file).pipe(
      timeout(12000),
      map((res: any) => {
        this.pipelineProgress.set(100);
        this.classificationStatus.set('PROCESSING_BACKGROUND');
        return res as AiResult;
      }),
      catchError((error) => {
        console.error('AI image analysis timed out or failed, using fallback:', error);
        this.classificationStatus.set('FAILED');
        return of({
          success: true,
          title: 'Civic Infrastructure Issue',
          description:
            'Grievance registered. AI analysis fallback applied due to response timeout.',
          department: 'Roads & Transport',
          confidence: 70,
          priority: 'low',
          departmentInput: 'Roads & Transport',
        } as AiResult);
      })
    );
  }

  /** Alias for backward compatibility */
  public analyzeComplaintImage(file: File): Observable<AiResult> {
    return this.analyzeImage(file);
  }

  // ---------------------------------------------------------------------
  // Helper / utility endpoints – unchanged from the previous implementation
  // ---------------------------------------------------------------------
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

  /**
   * Refactored to utilize a standard HTTP polling workflow to track the background job progress.
   * This completely avoids the EventSource stream allocation issues and prevents connection hangs.
   */
  public analyzeImageStream(analysisId: string): Observable<any> {
    return new Observable((observer) => {
      if (!analysisId) {
        observer.error(new Error('AI job ID missing from response'));
        return;
      }

      console.log('[AiService] Polling status updates for job:', analysisId);

      const pollingInterval = setInterval(() => {
        this.getJobStatus(analysisId).subscribe({
          next: (res: any) => {
            console.log('[AiService] Polling status update:', res);

            // Map backend job status response to the structure expected by the component
            const event = {
              status: res.status,
              progress: res.progress,
              ...res.results
            };

            observer.next(event);

            if (res.status === 'completed' || res.status === 'failed') {
              clearInterval(pollingInterval);
              observer.complete();
            }
          },
          error: (err) => {
            console.error('[AiService] Polling error:', err);
            clearInterval(pollingInterval);
            observer.error(err);
          }
        });
      }, 1500);

      return () => {
        clearInterval(pollingInterval);
      };
    });
  }
}
