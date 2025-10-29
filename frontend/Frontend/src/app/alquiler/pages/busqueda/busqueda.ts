import { ChangeDetectionStrategy, Component, inject,signal } from '@angular/core';
import { InformationBar } from '../../../shared/components/Information-bar/Information-bar';
import { NavBar } from '../../components/navBar/navBar';
import { SearchInput } from '../../components/search-input/search-input';
import { ListItem } from "../../components/list-item/list-item";
import { SelectedBar } from "../../components/Selected-bar/Selected-bar";
import { ClienteService } from '../../services/Cliente.service';
import {toSignal} from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-busqueda',
  imports: [InformationBar, NavBar, SearchInput, ListItem, SelectedBar],
  templateUrl: './busqueda.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Busqueda { 
  isNavBarExpanded = false;
  clienteService= inject(ClienteService)
  onNavBarToggle(newState: boolean) {
    this.isNavBarExpanded = newState;
  }
  clienteArray = toSignal(this.clienteService.showClientes(),{
    initialValue: []
  })
  
  
}
