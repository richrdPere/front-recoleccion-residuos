import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-monitoreo-page',
  imports: [],
  templateUrl: './monitoreo-page.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoreoPageComponent {


  // this.monitoreoService
  // .getMonitoreoOperacion({
  //   fecha: '2026-09-07',
  // })
  // .subscribe({
  //   next: ({ data }) => {
  //     console.log('Resumen:', data.resumen);
  //     console.log('Programaciones:', data.items);

  //     for (const item of data.items) {
  //       console.log('Vehículo:', item.vehiculo.placa);
  //       console.log('Estado GPS:', item.gps.estado);
  //       console.log('Avance:', item.progreso.porcentaje);

  //       if (item.ultima_ubicacion) {
  //         const latitud = Number(
  //           item.ultima_ubicacion.latitud,
  //         );

  //         const longitud = Number(
  //           item.ultima_ubicacion.longitud,
  //         );

  //         console.log('Coordenadas:', latitud, longitud);
  //       }
  //     }
  //   },
  //   error: (error) => {
  //     console.error(error.message);
  //   },
  // });
}
