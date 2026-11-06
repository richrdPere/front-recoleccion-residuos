import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio-publico-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio-publico-page.component.html' ,
})
export class InicioPublicoPageComponent {
  readonly accesos = [
    {
      titulo: 'Mi sector',
      descripcion: 'Consulta la información de las rutas de tu sector.',
      icono: 'fa-solid fa-location-dot',
      ruta: '/consulta',
    },
    {
      titulo: 'Cronogramas',
      descripcion: 'Diferencia los horarios habituales y los servicios programados.',
      icono: 'fa-regular fa-calendar',
      ruta: '/cronogramas',
    },
    {
      titulo: 'Seguimiento',
      descripcion: 'Revisa el estado del recorrido y la disponibilidad del mapa.',
      icono: 'fa-solid fa-truck',
      ruta: '/rutas',
    },
    {
      titulo: 'Reportar un problema',
      descripcion: 'Prepara un reporte relacionado con el servicio de recolección.',
      icono: 'fa-solid fa-comment-dots',
      ruta: '/reportar',
    },
  ];
}
