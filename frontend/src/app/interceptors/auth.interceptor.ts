import { HttpInterceptorFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip interceptor for login and callback endpoints
  const isAuthEndpoint = req.url.includes('/api/auth/login') || 
                        req.url.includes('/api/auth/callback');

  const modifiedReq = req.clone({
    withCredentials: true
  });

  if (isAuthEndpoint) {
    return next(modifiedReq);
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse): Observable<HttpEvent<unknown>> => {
      if (error.status === 401) {
        if (!req.url.includes('/api/auth/user')) {
          authService.logout().subscribe();
        }
      } else if (error.status === 403) {
        const isAdmin = authService.isAdmin();
        // Redirect based on role
        router.navigate([isAdmin ? '/admin' : '/home']);
      }
      return throwError(() => error);
    })
  );
};