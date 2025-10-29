import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InformationBar } from '../../../shared/components/Information-bar/Information-bar';
import { NavBar } from '../../components/navBar/navBar';

@Component({
  selector: 'app-registro',
  imports: [InformationBar,NavBar],
  templateUrl: './registro.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Registro { 
  isNavBarExpanded = false;
  onNavBarToggle(newState: boolean) {
    this.isNavBarExpanded = newState;
  }
}
