import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NavBar } from "../../../../components/navBar/navBar";
import { InformationBar } from "../../../../../shared/components/Information-bar/Information-bar";

@Component({
  selector: 'app-tarifa',
  imports: [NavBar, InformationBar],
  templateUrl: './tarifa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tarifa {
    isNavBarExpanded = signal(false);

  onNavBarToggle(newState: boolean) {
    this.isNavBarExpanded.set(newState);
  }
 }
