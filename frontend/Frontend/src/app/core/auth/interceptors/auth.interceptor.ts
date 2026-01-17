import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AUTH_TOKEN_KEY } from '../models/auth.models';

/**
 * Interceptor funcional para agregar el token JWT a las peticiones
 * y manejar el refresh automático cuando expira
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // URLs que no necesitan autenticación
  const publicUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh'
  ];

  // No agregar token a URLs públicas
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  
  if (isPublicUrl) {
    return next(req);
  }

  // Agregar token si existe
  const token = authService.getAccessToken();
  let authReq = req;
  
  if (token) {
    authReq = addTokenToRequest(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es error 401, intentar refrescar token
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return handle401Error(authReq, next, authService);
      }
      
      return throwError(() => error);
    })
  );
};

/**
 * Agrega el token de autorización al request
 */
function addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Maneja el error 401 intentando refrescar el token
 */
function handle401Error(
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn,
  authService: AuthService
) {
  return authService.refreshToken().pipe(
    switchMap(response => {
      // Token refrescado, reintentar la petición original
      const newReq = addTokenToRequest(req, response.accessToken);
      return next(newReq);
    }),
    catchError(err => {
      // No se pudo refrescar, el AuthService ya redirige a login
      return throwError(() => err);
    })
  );
}
