/**
 * AI Assistant Service
 * Handles all communication with backend AI services
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, interval } from 'rxjs';
import { map, catchError, retry, switchMap, takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

interface VoiceSession {
  sessionId: string;
  language: string;
  status: string;
  supportedIntents: any[];
  supportedLanguages: any;
}

interface IntentClassificationResult {
  intent: string;
  confidence: number;
  alternatives: any[];
  fallback: boolean;
  message: string;
}

interface VoiceProcessResult {
  text: string;
  confidence: number;
  intent: string;
  intentConfidence: number;
  alternatives: any[];
  languageMismatch: boolean;
}

interface WorkflowState {
  workflowId: number;
  workflowType: string;
  status: string;
  currentStep: string;
  nextSteps: string[];
}

interface AnalysisStatus {
  workflowId: number;
  department: { value: string; confidence: number; status: string };
  category: { value: string; confidence: number; status: string };
  severity: { value: string; confidence: number; status: string };
  allAnalysisComplete: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private apiUrl = `${environment.apiUrl}/ai-assistant`;

  // Session state
  private sessionSubject = new BehaviorSubject<VoiceSession | null>(null);
  public session$ = this.sessionSubject.asObservable();

  // Intent classification results
  private intentSubject = new BehaviorSubject<IntentClassificationResult | null>(null);
  public intent$ = this.intentSubject.asObservable();

  // Voice processing results
  private voiceResultSubject = new BehaviorSubject<VoiceProcessResult | null>(null);
  public voiceResult$ = this.voiceResultSubject.asObservable();

  // Workflow state
  private workflowSubject = new BehaviorSubject<WorkflowState | null>(null);
  public workflow$ = this.workflowSubject.asObservable();

  // Analysis status for polling
  private analysisStatusSubject = new BehaviorSubject<AnalysisStatus | null>(null);
  public analysisStatus$ = this.analysisStatusSubject.asObservable();

  // Error handling
  private errorSubject = new Subject<any>();
  public error$ = this.errorSubject.asObservable();

  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {
    this.setupErrorHandling();
  }

  /**
   * Initialize voice conversation session
   */
  initializeSession(language: string, userId?: number, deviceType: string = 'web'): Observable<VoiceSession> {
    return this.http.post<any>(`${this.apiUrl}/init-session`, {
      language,
      userId,
      deviceType
    }).pipe(
      map(response => response.data),
      retry(1),
      catchError(error => {
        this.handleError(error);
        throw error;
      })
    ).pipe(
      map(session => {
        this.sessionSubject.next(session);
        return session;
      })
    );
  }

  /**
   * Process voice input
   */
  processVoiceInput(sessionId: string, audioBlob: Blob, language: string = 'en-IN'): Observable<VoiceProcessResult> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        const audioBase64 = (reader.result as string).split(',')[1];
        
        this.http.post<any>(`${this.apiUrl}/process-voice`, {
          sessionId,
          audioBase64,
          language
        }).pipe(
          retry(1),
          catchError(error => {
            this.handleError(error);
            throw error;
          })
        ).subscribe(
          response => {
            const result = response.data;
            this.voiceResultSubject.next(result);
            observer.next(result);
            observer.complete();
          },
          error => observer.error(error)
        );
      };
      reader.readAsDataURL(audioBlob);
    });
  }

  /**
   * Classify user intent from text
   */
  classifyIntent(sessionId: string, text: string, language: string = 'en-IN'): Observable<IntentClassificationResult> {
    return this.http.post<any>(`${this.apiUrl}/classify-intent`, {
      sessionId,
      text,
      language
    }).pipe(
      map(response => response.data),
      retry(1),
      catchError(error => {
        this.handleError(error);
        throw error;
      })
    ).pipe(
      map(result => {
        this.intentSubject.next(result);
        return result;
      })
    );
  }

  /**
   * Generate speech (text to speech)
   */
  generateSpeech(sessionId: string, text: string, language: string = 'en-IN', options: any = {}): Observable<Blob> {
    return this.http.post<Blob>(`${this.apiUrl}/generate-speech`, {
      sessionId,
      text,
      language,
      options
    }, {
      responseType: 'blob' as any
    }).pipe(
      retry(1),
      catchError(error => {
        this.handleError(error);
        throw error;
      })
    );
  }

  /**
   * Initiate raise complaint workflow
   */
  initiateRaiseComplaintWorkflow(sessionId: string, userId: number, language: string = 'en-IN'): Observable<WorkflowState> {
    return this.http.post<any>(`${this.apiUrl}/workflow/raise-complaint`, {
      sessionId,
      userId,
      language
    }).pipe(
      map(response => response.data),
      retry(1),
      catchError(error => {
        this.handleError(error);
        throw error;
      })
    ).pipe(
      map(workflow => {
        this.workflowSubject.next(workflow);
        return workflow;
      })
    );
  }

  /**
   * Analyze complaint image
   */
  analyzeComplaintImage(workflowId: number, imagePath: string, language: string = 'en-IN'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/workflow/${workflowId}/analyze-image`, {
      imagePath,
      language
    }).pipe(
      retry(1),
      catchError(error => {
        this.handleError(error);
        throw error;
      })
    );
  }

  /**
   * Get image analysis status (for polling)
   */
  getAnalysisStatus(workflowId: number): Observable<AnalysisStatus> {
    return this.http.get<any>(`${this.apiUrl}/workflow/${workflowId}/analysis-status`).pipe(
      map(response => response.data),
      catchError(error => {
        this.handleError(error);
        throw error;
      })
    ).pipe(
      map(status => {
        this.analysisStatusSubject.next(status);
        return status;
      })
    );
  }

  /**
   * Poll for analysis status until complete
   */
  pollAnalysisStatus(workflowId: number, intervalMs: number = 1000, timeoutMs: number = 8000): Observable<AnalysisStatus> {
    return interval(intervalMs).pipe(
      switchMap(() => this.getAnalysisStatus(workflowId)),
      takeUntil(
        new Observable(observer => {
          setTimeout(() => {
            observer.next(null);
            observer.complete();
          }, timeoutMs);
        })
      ),
      catchError(error => {
        this.handleError(error);
        throw error;
      })
    );
  }

  /**
   * Check for duplicate complaints
   */
  checkDuplicateComplaints(
    workflowId: number,
    imagePath: string | null,
    description: string,
    location: any,
    department: string,
    category: string,
    language: string = 'en-IN'
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/workflow/${workflowId}/check-duplicates`, {
      imagePath,
      description,
      location,
      department,
      category,
      language
    }).pipe(
      retry(1),
      catchError(error => {
        this.handleError(error);
        throw error;
      })
    );
  }

  /**
   * Close voice session
   */
  closeSession(sessionId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/close-session`, {
      sessionId
    }).pipe(
      catchError(error => {
        this.handleError(error);
        throw error;
      })
    ).pipe(
      map(() => {
        this.sessionSubject.next(null);
        this.intentSubject.next(null);
        this.voiceResultSubject.next(null);
        this.workflowSubject.next(null);
        this.analysisStatusSubject.next(null);
      })
    );
  }

  /**
   * Get current session
   */
  getCurrentSession(): VoiceSession | null {
    return this.sessionSubject.value;
  }

  /**
   * Get current intent
   */
  getCurrentIntent(): IntentClassificationResult | null {
    return this.intentSubject.value;
  }

  /**
   * Get current workflow
   */
  getCurrentWorkflow(): WorkflowState | null {
    return this.workflowSubject.value;
  }

  /**
   * Error handling
   */
  private handleError(error: any): void {
    console.error('AI Assistant Service Error:', error);
    const errorMessage = error?.error?.message || 'An error occurred with the AI Assistant';
    this.errorSubject.next({
      message: errorMessage,
      error: error
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      console.error('AI Assistant Error:', error);
      // You can emit to a snackbar or notification service here
    });
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
