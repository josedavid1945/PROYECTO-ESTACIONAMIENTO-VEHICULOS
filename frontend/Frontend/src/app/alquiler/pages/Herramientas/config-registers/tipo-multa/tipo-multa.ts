import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { InformationBar } from "../../../../../shared/components/Information-bar/Information-bar";
import { NavBar } from "../../../../components/navBar/navBar";

@Component({
  selector: 'app-tipo-multa',
  imports: [InformationBar, NavBar],
  templateUrl: './tipo-multa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipoMulta {
   isNavBarExpanded = signal(false);

  onNavBarToggle(newState: boolean) {
    this.isNavBarExpanded.set(newState);
  }
 }
