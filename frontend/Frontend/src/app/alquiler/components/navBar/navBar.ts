import { ChangeDetectionStrategy, Component, effect, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './navBar.html',
  styleUrls: ['./navBar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  // Input properties
  isExpanded = input<boolean>(false);
  
  // Output events
  isExpandedChange = output<boolean>();

  // Auth state
  readonly currentUser = this.authService.currentUser;
  readonly fullName = this.authService.fullName;
  readonly userRole = this.authService.userRole;

  // Navigation items
  navItems: NavItem[] = [
    { path: 'busqueda/clientes', label: 'Clientes', icon: 'fas fa-users' },
    { path: 'busqueda/vehiculos', label: 'Vehículos', icon: 'fas fa-car' },
    { path: 'busqueda/tickets', label: 'Tickets', icon: 'fas fa-ticket-alt' },
    { path: 'registro', label: 'Registro', icon: 'fas fa-plus-circle' },
    { path: 'herramientas', label: 'Herramientas', icon: 'fas fa-tools' }
  ];

  // Methods
  toggleMenu() {
    const newState = !this.isExpanded();
    this.isExpandedChange.emit(newState);
  }

  // Active route tracking
  isActive(path: string): boolean {
    const currentPath = window.location.pathname;
    const fullPath = `/estacionamiento/${path}`;
    return currentPath.startsWith(fullPath);
  }

  // Logout
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  // Get user initials
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  // Get role display name
  getRoleDisplay(): string {
    const role = this.userRole();
    switch (role) {
      case 'admin': return 'Administrador';
      case 'operator': return 'Operador';
      default: return 'Usuario';
    }
  }
}

