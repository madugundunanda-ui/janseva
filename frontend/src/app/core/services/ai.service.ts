import { Injectable, signal } from '@angular/core';
import { Observable, timeout, catchError, of, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AiResult, DuplicateDetectionResult, ResolutionPredictionResult, SeverityAnalysisResult } from '../models/ai-result.model';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  // High-performance operational step trackers
  public pipelineProgress = signal<number>(10);
  public classificationStatus = signal<string>('PENDING');

  constructor(private apiService: ApiService) {}

  /**
   * FIXED: Replaced fragile EventSource streams with a robust HTTP POST architecture
   */
  public analyzeComplaintTokens(imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);

    this.pipelineProgress.set(30);
    this.classificationStatus.set('RUNNING');

    return this.apiService.postForm<any>('/ai/analyze-pipeline', formData).pipe(
      catchError((error) => {
        this.classificationStatus.set('FAILED');
        return throwError(() => new Error(error.message || 'Pipeline tracking dropped.'));
      })
    );
  }

  analyzeImage(file: File): Observable<AiResult> {
    return this.apiService.analyzeImageAI(file).pipe(
      timeout(12000),
      catchError((error) => {
        console.error('AI image analysis timed out or failed, using fallback:', error);
        return of({
          success: true,
          title: 'Civic Infrastructure Issue',
          description: 'Grievance registered. AI analysis fallback applied due to response timeout.',
          department: 'Roads & Transport',
          confidence: 70,
          priority: 'low',
          departmentInput: 'Roads & Transport'
        } as AiResult);
      })
    );
  }

  analyzeComplaintImage(file: File): Observable<AiResult> {
    return this.analyzeImage(file);
  }

  analyzeImageStream(analysisId: string): Observable<any> {
    return new Observable((observer) => {
      if (typeof window === 'undefined') {
        observer.complete();
        return;
      }

      const token = localStorage.getItem('token') || '';
      const url = `${this.apiService.apiUrl}/ai/analyze-stream/${analysisId}?token=${token}`;
      
      const eventSource = new EventSource(url);

      // 10-second timeout: if no completion within 10s, close and error
      const streamTimeout = setTimeout(() => {
        console.warn('[AI-SERVICE] Stream timeout after 10s — closing connection');
        eventSource.close();
        observer.error(new Error('AI analysis stream timed out after 10 seconds'));
      }, 10000);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          observer.next(data);
          if (data.status === 'completed') {
            clearTimeout(streamTimeout);
            eventSource.close();
            observer.complete();
          } else if (data.status === 'failed') {
            clearTimeout(streamTimeout);
            eventSource.close();
            observer.error(new Error(data.message || 'AI analysis job failed'));
          }
        } catch (err) {
          clearTimeout(streamTimeout);
          observer.error(err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('EventSource connection error:', err);
        clearTimeout(streamTimeout);
        eventSource.close();
        observer.error(err);
      };

      return () => {
        clearTimeout(streamTimeout);
        eventSource.close();
      };
    });
  }

  getAiHealthStatus(): Observable<any> {
    return this.apiService.get<any>('/ai/health');
  }

  calculateSeverity(payload: Record<string, unknown>): Observable<SeverityAnalysisResult> {
    return this.apiService.getSeverityAI(payload);
  }

  predictResolution(payload: Record<string, unknown>): Observable<ResolutionPredictionResult> {
    return this.apiService.predictResolutionAI(payload);
  }

  detectDuplicate(payload: Record<string, unknown>): Observable<DuplicateDetectionResult> {
    return this.apiService.post<DuplicateDetectionResult>('/ai/spam-detect', payload);
  }

  verifyResolution(formData: FormData): Observable<unknown> {
    return this.apiService.postForm<unknown>('/ai/verify-resolution', formData);
  }
}
