import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from "./alquiler/components/navBar/navBar";
import { InformationBar } from "./shared/components/Information-bar/Information-bar";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isNavBarExpanded = false;
  onNavBarToggle(newState: boolean) {
    this.isNavBarExpanded = newState;
  }
}
