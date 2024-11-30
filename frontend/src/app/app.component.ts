import { Component } from '@angular/core';

import { HomepageComponent } from './homepage/homepage.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HomepageComponent], // Import the homepage component
  template: `<app-homepage></app-homepage>`, // Embed the homepage component
  styleUrls: ['./homepage/homepage.component.css'],
})
export class AppComponent {
  title = 'listing-ui'; // Ensure this matches the test
}
