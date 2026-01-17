import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { filter, take, map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Helper para esperar a que la autenticación se inicialice
 * Esto previene race conditions donde los guards se ejecutan antes
 * de que se valide el token con el servidor
 */
async function waitForAuthInit(authService: AuthService): Promise<void> {
  if (authService.isInitialized()) return;
  
  const isInitialized$ = toObservable(authService.isInitialized);
  await firstValueFrom(
    isInitialized$.pipe(
      filter(initialized => initialized),
      take(1)
    )
  );
}

/**
 * Guard funcional que verifica si el usuario está autenticado
 * Espera a que se valide el token con el servidor antes de decidir
 */
export const authGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar validación con servidor
  await waitForAuthInit(authService);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Guardar la URL intentada para redirigir después del login
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url }
  });
  
  return false;
};

/**
 * Guard funcional que verifica si el usuario NO está autenticado
 * Útil para páginas de login/registro
 */
export const guestGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar validación con servidor
  await waitForAuthInit(authService);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Si ya está autenticado, redirigir según rol
  redirectByRole(authService, router);
  return false;
};

/**
 * Guard funcional que verifica roles específicos
 * Uso: canActivate: [roleGuard], data: { roles: ['admin', 'operator'] }
 */
export const roleGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar validación con servidor
  await waitForAuthInit(authService);

  // Primero verificar autenticación
  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Obtener roles permitidos de la configuración de la ruta
  const requiredRoles = route.data['roles'] as string[];
  
  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // Sin roles especificados, solo requiere autenticación
  }

  // Verificar si el usuario tiene alguno de los roles requeridos
  // El rol viene del SERVIDOR, no de localStorage
  const userRole = authService.userRole();
  
  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  }

  // Usuario no tiene permisos, redirigir a acceso denegado o a su página
  router.navigate(['/acceso-denegado']);
  return false;
};

/**
 * Guard para solo admin/operator
 * El rol se valida contra el servidor, no localStorage
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar validación con servidor
  await waitForAuthInit(authService);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
    return false;
  }

  // isAdmin() e isOperator() usan datos validados por el servidor
  if (authService.isAdmin() || authService.isOperator()) {
    return true;
  }

  router.navigate(['/usuario']);
  return false;
};

/**
 * Guard para solo usuarios normales
 * Previene que admins accedan a rutas de usuario
 */
export const userGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar validación con servidor
  await waitForAuthInit(authService);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
    return false;
  }

  if (authService.isUser()) {
    return true;
  }

  // Si es admin u operador, redirigir al dashboard admin
  router.navigate(['/admin']);
  return false;
};

/**
 * Función auxiliar para redirigir según el rol del usuario
 */
function redirectByRole(authService: AuthService, router: Router): void {
  if (authService.isAdmin() || authService.isOperator()) {
    router.navigate(['/admin']);
  } else {
    router.navigate(['/usuario']);
  }
}
