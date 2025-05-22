// app\core\interceptors\auth.interceptor.ts
import {HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AuthService} from '../auth/auth.service';
import {environment} from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService); // Usar inject()
  const token = authService.getToken();
  const isApiUrl = req.url.startsWith(environment.apiUrl);

  let clonedRequest = req;
  if (token && isApiUrl) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isApiUrl) {
        if (!req.url.includes('/api/auth/login')) {
          console.warn('Token inválido o expirado, cerrando sesión (interceptor).');
          authService.logout();
        }
      }
      return throwError(() => error);
    })
  );
};
