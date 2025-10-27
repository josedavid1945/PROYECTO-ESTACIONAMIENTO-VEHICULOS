import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-selected-bar',
  imports: [],
  templateUrl: './Selected-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectedBar { 
  opciones = ['Clientes', 'Vehículos','fecha'];
}
