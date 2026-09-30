import { Component } from '@angular/core';
import { latestRelease } from '@classes/releases';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss']
})
export class DocumentationComponent {
  readonly latestRelease = latestRelease;
}
