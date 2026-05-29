import { Injectable } from '@angular/core';
import { Observable, timeout, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { AiResult, DuplicateDetectionResult, ResolutionPredictionResult, SeverityAnalysisResult } from '../models/ai-result.model';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  constructor(private apiService: ApiService) {}

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

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          observer.next(data);
          if (data.status === 'completed') {
            eventSource.close();
            observer.complete();
          } else if (data.status === 'failed') {
            eventSource.close();
            observer.error(new Error(data.message || 'AI analysis job failed'));
          }
        } catch (err) {
          observer.error(err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('EventSource connection error:', err);
        eventSource.close();
        observer.error(err);
      };

      return () => {
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
