import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavBar } from '../../../alquiler/components/navBar/navBar';
import { InformationBar } from '../../components/Information-bar/Information-bar';

@Component({
  selector: 'app-home-page',
  imports: [NavBar,InformationBar],
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage { 
  isNavBarExpanded = false;
  onNavBarToggle(newState: boolean) {
    this.isNavBarExpanded = newState;
  }
}
