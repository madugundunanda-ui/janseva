import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AIProviderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/voice/interact`;

  send(payload: {
    text: string;
    language: string | null;
    sessionId: string;
    workflowName: string;
    deviceType: string;
    browser: string;
  }): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  stream(payload: any): Observable<string> {
    // Under design/not implemented yet, but signature matches future SSE streaming
    throw new Error('Streaming API not implemented in Phase 1.');
  }
}
