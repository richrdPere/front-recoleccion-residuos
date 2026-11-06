import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

import {
  PublicPageHeaderComponent,
} from '../../components/public-page-header/public-page-header.component';

import {
  SectorInformationCardComponent,
} from '../../components/sector-information-card/sector-information-card.component';

import {
  RouteStatusCardComponent,
} from '../../components/route-status-card/route-status-card.component';

import {
  PublicLocationMapComponent,
} from '../../components/public-location-map/public-location-map.component';
import { RUTAS_PUBLICAS_DEMO } from '../public-demo-data/public-demo-data.component';



@Component({
  selector: 'app-seguimiento-publico-page',
  standalone: true,
  imports: [
    PublicPageHeaderComponent,
    SectorInformationCardComponent,
    RouteStatusCardComponent,
    PublicLocationMapComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seguimiento-publico-page.component.html',
})
export class SeguimientoPublicoPageComponent {
  readonly rutas = RUTAS_PUBLICAS_DEMO;
  readonly idRuta = signal(this.rutas[0].idRuta);

  readonly mensaje = signal(
    'Selecciona una ruta para revisar su presentación.',
  );

  readonly ruta = computed(
    () => this.rutas.find(
      (item) => item.idRuta === this.idRuta(),
    ) ?? this.rutas[0],
  );

  seleccionarRuta(id: number): void {
    this.idRuta.set(id);

    this.mensaje.set(
      'Ruta seleccionada. La consulta de ubicación está pendiente de conexión.',
    );
  }

  actualizar(): void {
    this.mensaje.set(
      'La actualización del GPS estará disponible al conectar el servicio público.',
    );
  }
}
