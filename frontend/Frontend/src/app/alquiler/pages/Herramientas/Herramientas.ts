import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-herramientas',
  imports: [RouterLink],
  templateUrl: './Herramientas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Herramientas {}
