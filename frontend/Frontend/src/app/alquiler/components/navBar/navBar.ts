import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';

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
  // Input properties
  isExpanded = input<boolean>(false);
  
  // Output events
  isExpandedChange = output<boolean>();

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
}
