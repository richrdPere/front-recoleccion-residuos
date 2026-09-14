import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-found-page',
  imports: [],
  templateUrl: './no-found-page.component.html',
  styles: ``,
})
export class NoFoundPageComponent {
  constructor(
    private router: Router
  ) { }

  volver(): void {
    window.history.back();
  }

  irAlInicio(): void {

    this.router.navigate(['/admin']);

  }
}
