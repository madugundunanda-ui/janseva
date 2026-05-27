import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Extract meaningful details
    const message = error instanceof Error ? error.stack || error.message : String(error);
    
    // Log to console with distinct styling for visibility
    console.error('%c[JANSEVA GLOBAL ERROR]%c', 'background: #ff4d4f; color: white; padding: 2px 5px; border-radius: 3px;', '', error);

    // Dynamic Sentry reporting if available globally
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  }
}
