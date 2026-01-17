import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 px-4">
      <div class="max-w-md w-full text-center">
        <!-- Icono -->
        <div class="mx-auto h-24 w-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8">
          <svg class="h-14 w-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>

        <!-- Mensaje -->
        <h1 class="text-3xl font-bold text-white mb-4">Acceso Denegado</h1>
        <p class="text-slate-400 mb-8">
          No tienes permisos para acceder a esta sección. 
          Si crees que esto es un error, contacta al administrador.
        </p>

        <!-- Acciones -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            (click)="goBack()"
            class="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
          >
            Volver atrás
          </button>
          <a 
            [routerLink]="getHomeRoute()"
            class="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccesoDenegadoPage {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  goBack(): void {
    history.back();
  }

  getHomeRoute(): string {
    if (this.authService.isAdmin() || this.authService.isOperator()) {
      return '/admin';
    }
    if (this.authService.isAuthenticated()) {
      return '/usuario';
    }
    return '/login';
  }
}
