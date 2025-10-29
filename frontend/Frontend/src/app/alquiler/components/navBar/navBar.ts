import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterModule,  RouterLink,RouterLinkActive, ],
  templateUrl: './navBar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBar {
  isExpanded = input<boolean>(false);  // Por defecto false
  
  // Output para emitir cambios al padre
  isExpandedChange = output<boolean>();

  toggleMenu() {
    const newState = !this.isExpanded();
    this.isExpandedChange.emit(newState);  // Emitir al padre
  }

}
