import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from "@angular/router";
import { NavBar } from '../../components/navBar/navBar';
import { InformationBar } from '../../../shared/components/Information-bar/Information-bar';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterModule, NavBar, InformationBar],
  templateUrl: './layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  isExpanded = signal<boolean>(true);

  toggleMenu(newState: boolean) {
    this.isExpanded.set(newState);
  }
 }
