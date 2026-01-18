import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserProfile,
  TokenValidation,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  UserRole
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3002/auth';
  
  // Signals para estado reactivo
  private _currentUser = signal<UserProfile | null>(null);
  private _isAuthenticated = signal<boolean>(false);
  private _isLoading = signal<boolean>(false);
  private _isInitialized = signal<boolean>(false);
  
  // Computed signals públicos
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isInitialized = this._isInitialized.asReadonly();
  
  readonly userRole = computed(() => this._currentUser()?.role ?? null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  readonly isOperator = computed(() => this._currentUser()?.role === 'operator');
  readonly isUser = computed(() => this._currentUser()?.role === 'user');
  readonly fullName = computed(() => {
    const user = this._currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  /**
   * Inicializa el estado de autenticación desde localStorage
   * Valida el token con el servidor para prevenir manipulación
   */
  private initializeAuth(): void {
    const token = this.getAccessToken();
    const userStr = localStorage.getItem(USER_KEY);
    
    if (token && userStr) {
      try {
        // Temporalmente establecer el usuario para UI inmediata
        const cachedUser = JSON.parse(userStr) as UserProfile;
        
        // Validar token con el servidor - CRÍTICO para seguridad
        this.validateToken().subscribe({
          next: (validation) => {
            if (validation.valid && validation.user) {
              // Usar datos del SERVIDOR, no del localStorage (previene manipulación)
              const serverUser: UserProfile = {
                id: validation.user.id,
                email: validation.user.email,
                firstName: validation.user.firstName || cachedUser.firstName,
                lastName: validation.user.lastName || cachedUser.lastName,
                role: validation.user.role, // ROL DESDE SERVIDOR
                status: validation.user.status || cachedUser.status,
                createdAt: cachedUser.createdAt
              };
              this.setUser(serverUser);
              this._isAuthenticated.set(true);
            } else {
              this.clearAuth();
            }
            this._isInitialized.set(true);
          },
          error: () => {
            this.clearAuth();
            this._isInitialized.set(true);
          }
        });
      } catch {
        this.clearAuth();
        this._isInitialized.set(true);
      }
    } else {
      this._isInitialized.set(true);
    }
  }

  /**
   * Login de usuario
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        this.setTokens(response.accessToken, response.refreshToken);
        this.setUser(response.user);
        this._isAuthenticated.set(true);
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Registro de nuevo usuario
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData).pipe(
      tap(response => {
        this.setTokens(response.accessToken, response.refreshToken);
        this.setUser(response.user);
        this._isAuthenticated.set(true);
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Logout del usuario
   */
  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    
    // Si hay token, intentar invalidarlo en el servidor
    const logoutRequest = refreshToken 
      ? this.http.post<void>(`${this.API_URL}/logout`, { refreshToken: refreshToken })
      : of(void 0);

    return logoutRequest.pipe(
      tap(() => {
        this.clearAuth();
        this.router.navigate(['/login']);
      }),
      catchError(() => {
        // Limpiar de todos modos aunque falle el servidor
        this.clearAuth();
        this.router.navigate(['/login']);
        return of(void 0);
      })
    );
  }

  /**
   * Refresca el access token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { 
      refreshToken: refreshToken 
    }).pipe(
      tap(response => {
        this.setTokens(response.accessToken, response.refreshToken);
        this.setUser(response.user);
      }),
      catchError(error => {
        this.clearAuth();
        this.router.navigate(['/login']);
        return this.handleError(error);
      })
    );
  }

  /**
   * Valida el token actual
   */
  validateToken(): Observable<TokenValidation> {
    return this.http.get<TokenValidation>(`${this.API_URL}/validate`);
  }

  /**
   * Obtiene el perfil del usuario actual
   */
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/me`).pipe(
      tap(user => {
        this.setUser(user);
      })
    );
  }

  /**
   * Verifica si el usuario tiene uno de los roles especificados
   */
  hasRole(...roles: UserRole[]): boolean {
    const currentRole = this._currentUser()?.role;
    return currentRole ? roles.includes(currentRole) : false;
  }

  /**
   * Obtiene el access token del localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  /**
   * Obtiene el refresh token del localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Guarda los tokens en localStorage
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Guarda el usuario en localStorage y actualiza el signal
   */
  private setUser(user: UserProfile): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  /**
   * Limpia toda la información de autenticación
   */
  private clearAuth(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
  }

  /**
   * Maneja errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = error.error.message;
    } else {
      // Error del servidor
      errorMessage = error.error?.message || `Error: ${error.status}`;
    }
    
    return throwError(() => ({ 
      statusCode: error.status, 
      message: errorMessage 
    }));
  }
}
