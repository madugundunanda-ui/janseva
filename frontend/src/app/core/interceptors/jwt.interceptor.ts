import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  let token: string | null = null;
  
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && typeof window !== 'undefined') {
        if (error.status === 401) {
          // Invalid/expired token — clear session and redirect to login
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } catch {}
          
          const isPublicPath = window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname.startsWith('/auth');
          if (!isPublicPath) {
            let loginPath = '/auth/citizen/login';
            if (window.location.pathname.startsWith('/dashboard/admin') || window.location.pathname.startsWith('/admin')) {
              loginPath = '/admin/login';
            } else if (window.location.pathname.startsWith('/dashboard/officer') || window.location.pathname.startsWith('/officer')) {
              loginPath = '/officer/login';
            } else if (window.location.pathname.startsWith('/dashboard/supervisor') || window.location.pathname.startsWith('/supervisor')) {
              loginPath = '/supervisor/login';
            }

            try {
              const returnUrl = encodeURIComponent(window.location.pathname + window.location.search || '/');
              window.location.href = `${loginPath}?returnUrl=${returnUrl}`;
            } catch {
              window.location.href = loginPath;
            }
          }
          return throwError(() => error);
        }
        if (error.status === 403) {
          // Authenticated but not authorized for this resource — redirect to dashboard
          try {
            window.location.href = '/dashboard';
          } catch {}
          return throwError(() => error);
        }
      }
      return throwError(() => error);
    })
  );
};
