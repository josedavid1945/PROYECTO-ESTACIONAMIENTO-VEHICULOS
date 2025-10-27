import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavBar } from '../../components/navBar/navBar';
import { InformationBar } from '../../../shared/components/Information-bar/Information-bar';

@Component({
  selector: 'app-vista-secciones',
  imports: [NavBar,InformationBar],
  templateUrl: './vista-secciones.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VistaSecciones { 
  isNavBarExpanded = false;
  onNavBarToggle(newState: boolean) {
    this.isNavBarExpanded = newState;
  }
}
