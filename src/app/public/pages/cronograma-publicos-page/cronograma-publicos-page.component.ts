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
  ScheduleCardComponent,
} from '../../components/schedule-card/schedule-card.component';

import {
  NextCollectionCardComponent,
} from '../../components/next-collection-card/next-collection-card.component';
import { RUTAS_PUBLICAS_DEMO } from '../public-demo-data/public-demo-data.component';



@Component({
  selector: 'app-cronograma-publicos-page',
  standalone: true,
  imports: [
    PublicPageHeaderComponent,
    SectorInformationCardComponent,
    ScheduleCardComponent,
    NextCollectionCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cronograma-publicos-page.component.html',
})
export class CronogramaPublicosPageComponent {
  readonly rutas = RUTAS_PUBLICAS_DEMO;
  readonly idRuta = signal(this.rutas[0].idRuta);

  // Mes fijo para poder revisar los datos de demostración.
  readonly mes = signal('2026-11');

  readonly ruta = computed(
    () => this.rutas.find(
      (item) => item.idRuta === this.idRuta(),
    ) ?? this.rutas[0],
  );

  readonly serviciosMes = computed(
    () => this.ruta().servicios.filter(
      (servicio) => servicio.fecha.startsWith(`${this.mes()}-`),
    ),
  );

  readonly mesLabel = computed(() => {
    const [year, month] = this.mes().split('-').map(Number);

    return new Intl.DateTimeFormat('es-PE', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  });

  seleccionarMes(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return;

    const year = Number(value.slice(0, 4));

    if (year >= 2000 && year <= 2100) {
      this.mes.set(value);
    }
  }
}
