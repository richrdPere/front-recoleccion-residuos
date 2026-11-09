import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import {
  CommonModule,
} from '@angular/common';

import {
  FormsModule,
} from '@angular/forms';

import {
  Subscription,
  catchError,
  finalize,
  forkJoin,
  of,
} from 'rxjs';

import {
  HistorialService,
  HistorialListado,
  HistorialDetalle,
  HistorialTrazado,
} from '../../services/historial.service';

import { HistorialMapaComponent } from '../components/historial-mapa/historial-mapa.component';

const fechaPeru = (fecha: Date): string => {
  const partes = new Intl.DateTimeFormat(
    'en',
    {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  ).formatToParts(fecha);

  const valor = (tipo: string) =>
    partes.find(p => p.type === tipo)?.value;

  return `${valor('year')}-${valor('month')}-${valor('day')}`;
};

@Component({
  selector: 'app-recorridos-page',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    HistorialMapaComponent,
  ],

  templateUrl: './recorridos-page.component.html',
})
export class RecorridosPageComponent
  implements OnInit, OnDestroy {

  private readonly api = inject(HistorialService);

  readonly listado = signal<HistorialListado | null>(null);
  readonly detalle = signal<HistorialDetalle | null>(null);
  readonly trazado = signal<HistorialTrazado | null>(null);

  readonly cargando = signal(false);
  readonly cargandoDetalle = signal(false);

  readonly error = signal<string | null>(null);
  readonly errorDetalle = signal<string | null>(null);
  readonly errorTrazado = signal<string | null>(null);

  fechaInicio = fechaPeru(
    new Date(Date.now() - 30 * 86400000),
  );

  fechaFin = fechaPeru(new Date());

  estado = 'FINALIZADO';

  idZona: number | null = null;
  idRuta: number | null = null;
  idVehiculo: number | null = null;

  private consulta?: Subscription;
  private consultaDetalle?: Subscription;

  ngOnInit(): void {
    this.buscar();
  }

  buscar(page = 1): void {
    this.consulta?.unsubscribe();

    this.cargando.set(true);
    this.error.set(null);

    const filtros: Record<string, string | number> = {
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin,
      estado: this.estado,
      page,
      limit: 10,
    };

    if (this.idZona !== null) {
      filtros['id_zona'] = this.idZona;
    }

    if (this.idRuta !== null) {
      filtros['id_ruta'] = this.idRuta;
    }

    if (this.idVehiculo !== null) {
      filtros['id_vehiculo'] = this.idVehiculo;
    }

    this.consulta = this.api.listar(filtros)
      .pipe(
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: response => {
          if (!response.success) {
            this.error.set(response.message);
            return;
          }

          this.listado.set(response.data);
        },

        error: error => {
          this.listado.set(null);

          this.error.set(
            error.error?.message ??
            'No se pudo consultar el historial.',
          );
        },
      });
  }

  ver(id: number): void {
    this.consultaDetalle?.unsubscribe();

    this.detalle.set(null);
    this.trazado.set(null);

    this.errorDetalle.set(null);
    this.errorTrazado.set(null);
    this.cargandoDetalle.set(true);

    this.consultaDetalle = forkJoin({
      detalle: this.api.detalle(id),

      trazado: this.api.trazado(id).pipe(
        catchError(error => {
          this.errorTrazado.set(
            error.error?.message ??
            'No se pudo consultar el trazado.',
          );

          return of(null);
        }),
      ),
    })
      .pipe(
        finalize(() => this.cargandoDetalle.set(false)),
      )
      .subscribe({
        next: response => {
          if (!response.detalle.success) {
            this.errorDetalle.set(
              response.detalle.message,
            );

            return;
          }

          this.detalle.set(
            response.detalle.data,
          );

          if (response.trazado?.success) {
            this.trazado.set(
              response.trazado.data,
            );
          }
        },

        error: error => {
          this.errorDetalle.set(
            error.error?.message ??
            'No se pudo consultar el detalle.',
          );
        },
      });
  }

  duracion(segundos: number | null): string {
    if (segundos === null) return 'Sin determinar';

    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const restantes = segundos % 60;

    return `${horas} h ${minutos} min ${restantes} s`;
  }

  ngOnDestroy(): void {
    this.consulta?.unsubscribe();
    this.consultaDetalle?.unsubscribe();
  }
}

// import { CommonModule, DatePipe, } from '@angular/common';
// import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { finalize } from 'rxjs';
// import Swal from 'sweetalert2';

// // Services
// import { RecorridosService } from '../../services/recorridos.service';

// // Interfaces
// import { GetRecorridoEventosParams, RecorridoEvento } from '../../interfaces/recorridos';

// @Component({
//   selector: 'app-recorridos-page',
//   imports: [CommonModule, FormsModule],
//   templateUrl: './recorridos-page.component.html',
//   styles: ``,

// })
// export class RecorridosPageComponent implements OnInit {

//   // Vehiculos
//   recorridos: RecorridoEvento[] = [];
//   recorrido_id: number | null = null;
//   isLoading = true;

//   mostrarModal = false;
//   mostrarModalView = false;
//   modoEdicion = false;
//   recorridoSeleccionado: any = null;

//   searchTimeout: any;

//   // Search
//   tipoEvento: string = '';

//   // Paginado
//   page = 1;
//   limit = 5;
//   totalItems = 0;
//   totalPages = 0;
//   currentPage = 1;

//   pageSizeOptions = [5, 10, 20, 50];


//   // Selectores


//   constructor(
//     private recorridosService: RecorridosService,
//     private cdr: ChangeDetectorRef,
//   ) { }

//   ngOnInit(): void {
//     // this.getRecorridosPaginated();
//   }

//   // ================================
//   // Methods
//   // ================================
//   // getRecorridosPaginated() {
//   //   const params: GetRecorridoEventosParams = {
//   //     page: this.page,
//   //     limit: this.limit,
//   //   };



//   //   this.isLoading = true;

//   //   this.recorridosService.getEventos(params)
//   //     .pipe(
//   //       finalize(() => {
//   //         this.isLoading = false;
//   //         this.cdr.markForCheck();
//   //       }),
//   //     )
//   //     .subscribe({
//   //       next: (res) => {

//   //         const paginacion = res.data;

//   //         this.vehiculos = paginacion.items;
//   //         this.totalItems = paginacion.total;
//   //         this.currentPage = paginacion.page;

//   //         this.page = paginacion.page;
//   //         this.limit = paginacion.limit;
//   //         this.totalPages = paginacion.totalPages;
//   //       },
//   //       error: (err) => {
//   //         console.error(err);
//   //         this.isLoading = false;

//   //         this.vehiculos = [];
//   //         this.totalItems = 0;
//   //         this.totalPages = 0;
//   //       }
//   //     });
//   // }

//   // // - Eliminar vehiculo
//   // eliminarVehiculo(vehiculo: VehiculoData) {
//   //   Swal.fire({
//   //     title: '¿Eliminar unidad?',
//   //     text: `Se eliminará la unidad ${vehiculo.codigo}`,
//   //     icon: 'warning',
//   //     showCancelButton: true,
//   //     confirmButtonText: 'Sí, eliminar',
//   //     cancelButtonText: 'Cancelar',
//   //     confirmButtonColor: '#d33',
//   //     cancelButtonColor: '#3085d6'
//   //   }).then((result) => {

//   //     if (result.isConfirmed) {

//   //       this.vehiculosService.deleteVehiculo(vehiculo.id_vehiculo)
//   //         .subscribe({
//   //           next: () => {

//   //             Swal.fire({
//   //               icon: 'success',
//   //               title: 'Unidad eliminada',
//   //               text: 'La unidad fue eliminada correctamente',
//   //               timer: 2000,
//   //               showConfirmButton: false
//   //             });

//   //             this.getVehiculosPaginated();
//   //           },
//   //           error: (err) => {

//   //             console.error(err);

//   //             Swal.fire({
//   //               icon: 'error',
//   //               title: 'Error',
//   //               text: 'No se pudo eliminar la unidad'
//   //             });

//   //           }
//   //         });
//   //     }
//   //   });
//   // }

//   // // Editar vehiculo
//   // editarUnidad(vehiculo: VehiculoData) {
//   //   this.modoEdicion = true;
//   //   this.vehiculoSeleccionado = { ...vehiculo };
//   //   this.mostrarModal = true;
//   // }

//   // // Ver vehiculo
//   // verVehiculo(vehiculo: VehiculoData) {
//   //   this.vehiculo_id = vehiculo.id_vehiculo;
//   //   this.mostrarModalView = true;
//   // }

//   // // CAMBIAR ESTADO
//   // cambiarEstado(vehiculo: VehiculoData) {

//   //   this.vehiculosService.changeEstado(vehiculo.id_vehiculo, !vehiculo.estado)
//   //     .subscribe({
//   //       next: (res) => {

//   //         vehiculo.estado = res.data.estado;

//   //         Swal.fire({
//   //           icon: 'success',
//   //           title: res.message,
//   //           timer: 1500,
//   //           showConfirmButton: false
//   //         });
//   //       },
//   //       error: (err) => console.error(err)
//   //     });

//   // }
//   // ================================
//   // Helpers methods
//   // ================================
//   getIconoUnidad(
//     tipo: string | null | undefined,
//   ): string {
//     const tipoNormalizado = tipo?.trim().toUpperCase() ?? '';

//     if (
//       tipoNormalizado.includes('MOTO')
//     ) {
//       return 'fa-motorcycle';
//     }

//     return 'fa-truck-field-un';
//   }
//   // onSearchChange() {
//   //   clearTimeout(this.searchTimeout);

//   //   this.searchTimeout = setTimeout(() => {
//   //     this.page = 1;
//   //     this.getVehiculosPaginated();
//   //   }, 300);
//   // }

//   onPageSizeChange() {
//     this.currentPage = 1; // vuelve a la primera página
//   }

//   // onFiltroChange() {
//   //   this.page = 1;
//   //   this.getVehiculosPaginated();
//   // }

//   // cambiarPagina(nuevaPagina: number) {
//   //   if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
//   //   this.page = nuevaPagina;
//   //   this.getVehiculosPaginated();
//   // }

//   // cambiarLimite() {
//   //   this.limit = Number(this.limit);
//   //   this.page = 1;
//   //   this.getVehiculosPaginated();
//   // }


//   // getTipoIcon(
//   //   tipo: TipoVehiculo,
//   // ): string {
//   //   const icons:
//   //     Record<TipoVehiculo, string> = {
//   //     CAMION_COMPACTADOR:
//   //       'fa-truck',

//   //     CAMION_BARANDA:
//   //       'fa-truck-pickup',

//   //     CAMION_VOLQUETE:
//   //       'fa-truck-moving',

//   //     MOTOFURGON:
//   //       'fa-motorcycle',

//   //     OTRO:
//   //       'fa-car-side',
//   //   };

//   //   return icons[tipo] ??
//   //     'fa-truck';
//   // }


//   getEstadoOperativoClass(estado: string): {
//     label: string;
//     class: string;
//   } {
//     const map: Record<string, {
//       label: string;
//       class: string;
//     }> = {
//       DISPONIBLE: {
//         label: 'DISPONIBLE',
//         class: 'badge-info'
//       },
//       ASIGNADO: {
//         label: 'ASIGNADO',
//         class: 'badge-primary'
//       },
//       EN_RUTA: {
//         label: 'ASIGNADO',
//         class: 'badge-success'
//       },
//       EN_MANTENIMIENTO: {
//         label: 'MANTENIMIENTO',
//         class: 'badge-accent'
//       },
//       FUERA_DE_SERVICIO: {
//         label: 'FUERA_DE_SERVICIO',
//         class: 'badge-error'
//       }
//     };

//     return map[estado] || {
//       label: estado,
//       class: 'badge-neutral'
//     };
//   }

//   // limpiarFiltros(): void {
//   //   this.searchBusqueda = '';
//   //   this.estadoOperativoBusqueda = '';
//   //   this.tipoVehiculoBusqueda = '';
//   //   this.page = 1;

//   //   this.getVehiculosPaginated();
//   // }

//   // ================================
//   // Modales methods
//   // ================================
//   // abrirModal() {
//   //   this.modoEdicion = false;
//   //   this.vehiculoSeleccionado = null;
//   //   this.mostrarModal = true;
//   // }

//   // cerrarModal() {
//   //   this.mostrarModal = false;
//   // }

//   // cerrarModalInfo() {
//   //   this.mostrarModalView = false;
//   //   this.vehiculo_id = null;
//   // }
// }
