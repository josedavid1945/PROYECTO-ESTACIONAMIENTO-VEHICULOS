import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-layout',
  imports: [RouterModule],
  templateUrl: './layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  isExpanded = input<boolean>(true);
 }
