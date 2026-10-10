import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `<h1>Stranica nije pronađena</h1>
    <p>Provjeri adresu ili se vrati na svoj pregled.</p>
    <a class="button-link" routerLink="/">Povratak na početnu</a>`,
})
export class NotFoundComponent {}
