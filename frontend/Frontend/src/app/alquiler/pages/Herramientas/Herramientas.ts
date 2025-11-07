import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InformationBar } from '../../../shared/components/Information-bar/Information-bar';
import { NavBar } from '../../components/navBar/navBar';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-herramientas',
  imports: [InformationBar, NavBar, RouterLink],
  templateUrl: './Herramientas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Herramientas { 
  isNavBarExpanded = false;
  onNavBarToggle(newState: boolean) {
    this.isNavBarExpanded = newState;
  }
}
