import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NavBar } from "../../../../components/navBar/navBar";
import { InformationBar } from "../../../../../shared/components/Information-bar/Information-bar";

@Component({
  selector: 'app-tipo-vehiculo',
  imports: [NavBar, InformationBar],
  templateUrl: './tipo-vehiculo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipoVehiculo {
  isNavBarExpanded = signal(false);

  onNavBarToggle(newState: boolean) {
    this.isNavBarExpanded.set(newState);
  }
 }
