import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from "./alquiler/components/navBar/navBar";
import { InformationBar } from "./shared/components/Information-bar/Information-bar";
import { ChatWidgetComponent } from "./shared/components/chat-widget/chat-widget.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatWidgetComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isNavBarExpanded = false;
  onNavBarToggle(newState: boolean) {
    this.isNavBarExpanded = newState;
  }
}
