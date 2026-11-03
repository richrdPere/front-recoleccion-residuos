import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Services
import { NotificacionesSesionService } from './features/notificaciones/services/notificaciones-sesion.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  protected readonly title = signal(
    'front-recoleccion-residuos',
  );

  private readonly notificacionesSesion = inject(NotificacionesSesionService);

  constructor() {
    this.notificacionesSesion.iniciar();
  }
}
