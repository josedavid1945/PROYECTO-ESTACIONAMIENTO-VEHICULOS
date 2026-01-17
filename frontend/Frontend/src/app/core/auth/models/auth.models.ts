// Auth Models - Interfaces para el sistema de autenticación

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export type UserRole = 'admin' | 'operator' | 'user';
export type UserStatus = 'active' | 'inactive' | 'locked';

export interface TokenValidation {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
  };
  error?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthError {
  statusCode: number;
  message: string;
  error?: string;
}

// Constantes para localStorage
export const AUTH_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'current_user';
