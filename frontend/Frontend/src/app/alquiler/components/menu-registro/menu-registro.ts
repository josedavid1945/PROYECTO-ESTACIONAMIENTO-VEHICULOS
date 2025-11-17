import { Component, output } from '@angular/core';

@Component({
  selector: 'app-menu-registro',
  standalone: true,
  imports: [],
  templateUrl: './menu-registro.html'
})
export class MenuRegistroComponent {
  opcionSeleccionada = output<'nuevo-cliente' | 'asignar-espacio' | 'desocupar-espacio'>();

  seleccionarOpcion(opcion: 'nuevo-cliente' | 'asignar-espacio' | 'desocupar-espacio') {
    this.opcionSeleccionada.emit(opcion);
  }
}
