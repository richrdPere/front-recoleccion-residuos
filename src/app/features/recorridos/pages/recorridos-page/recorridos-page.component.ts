import { CommonModule, DatePipe, } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { RecorridosService } from '../../services/recorridos.service';

// Interfaces
import { GetRecorridoEventosParams, RecorridoEvento } from '../../interfaces/recorridos';

@Component({
  selector: 'app-recorridos-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './recorridos-page.component.html',
  styles: ``,

})
export class RecorridosPageComponent implements OnInit {

  // Vehiculos
  recorridos: RecorridoEvento[] = [];
  recorrido_id: number | null = null;
  isLoading = true;

  mostrarModal = false;
  mostrarModalView = false;
  modoEdicion = false;
  recorridoSeleccionado: any = null;

  searchTimeout: any;

  // Search
  tipoEvento: string = '';

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];


  // Selectores


  constructor(
    private recorridosService: RecorridosService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // this.getRecorridosPaginated();
  }

  // ================================
  // Methods
  // ================================
  // getRecorridosPaginated() {
  //   const params: GetRecorridoEventosParams = {
  //     page: this.page,
  //     limit: this.limit,
  //   };



  //   this.isLoading = true;

  //   this.recorridosService.getEventos(params)
  //     .pipe(
  //       finalize(() => {
  //         this.isLoading = false;
  //         this.cdr.markForCheck();
  //       }),
  //     )
  //     .subscribe({
  //       next: (res) => {

  //         const paginacion = res.data;

  //         this.vehiculos = paginacion.items;
  //         this.totalItems = paginacion.total;
  //         this.currentPage = paginacion.page;

  //         this.page = paginacion.page;
  //         this.limit = paginacion.limit;
  //         this.totalPages = paginacion.totalPages;
  //       },
  //       error: (err) => {
  //         console.error(err);
  //         this.isLoading = false;

  //         this.vehiculos = [];
  //         this.totalItems = 0;
  //         this.totalPages = 0;
  //       }
  //     });
  // }

  // // - Eliminar vehiculo
  // eliminarVehiculo(vehiculo: VehiculoData) {
  //   Swal.fire({
  //     title: '¿Eliminar unidad?',
  //     text: `Se eliminará la unidad ${vehiculo.codigo}`,
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonText: 'Sí, eliminar',
  //     cancelButtonText: 'Cancelar',
  //     confirmButtonColor: '#d33',
  //     cancelButtonColor: '#3085d6'
  //   }).then((result) => {

  //     if (result.isConfirmed) {

  //       this.vehiculosService.deleteVehiculo(vehiculo.id_vehiculo)
  //         .subscribe({
  //           next: () => {

  //             Swal.fire({
  //               icon: 'success',
  //               title: 'Unidad eliminada',
  //               text: 'La unidad fue eliminada correctamente',
  //               timer: 2000,
  //               showConfirmButton: false
  //             });

  //             this.getVehiculosPaginated();
  //           },
  //           error: (err) => {

  //             console.error(err);

  //             Swal.fire({
  //               icon: 'error',
  //               title: 'Error',
  //               text: 'No se pudo eliminar la unidad'
  //             });

  //           }
  //         });
  //     }
  //   });
  // }

  // // Editar vehiculo
  // editarUnidad(vehiculo: VehiculoData) {
  //   this.modoEdicion = true;
  //   this.vehiculoSeleccionado = { ...vehiculo };
  //   this.mostrarModal = true;
  // }

  // // Ver vehiculo
  // verVehiculo(vehiculo: VehiculoData) {
  //   this.vehiculo_id = vehiculo.id_vehiculo;
  //   this.mostrarModalView = true;
  // }

  // // CAMBIAR ESTADO
  // cambiarEstado(vehiculo: VehiculoData) {

  //   this.vehiculosService.changeEstado(vehiculo.id_vehiculo, !vehiculo.estado)
  //     .subscribe({
  //       next: (res) => {

  //         vehiculo.estado = res.data.estado;

  //         Swal.fire({
  //           icon: 'success',
  //           title: res.message,
  //           timer: 1500,
  //           showConfirmButton: false
  //         });
  //       },
  //       error: (err) => console.error(err)
  //     });

  // }
  // ================================
  // Helpers methods
  // ================================
  getIconoUnidad(
    tipo: string | null | undefined,
  ): string {
    const tipoNormalizado = tipo?.trim().toUpperCase() ?? '';

    if (
      tipoNormalizado.includes('MOTO')
    ) {
      return 'fa-motorcycle';
    }

    return 'fa-truck-field-un';
  }
  // onSearchChange() {
  //   clearTimeout(this.searchTimeout);

  //   this.searchTimeout = setTimeout(() => {
  //     this.page = 1;
  //     this.getVehiculosPaginated();
  //   }, 300);
  // }

  onPageSizeChange() {
    this.currentPage = 1; // vuelve a la primera página
  }

  // onFiltroChange() {
  //   this.page = 1;
  //   this.getVehiculosPaginated();
  // }

  // cambiarPagina(nuevaPagina: number) {
  //   if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
  //   this.page = nuevaPagina;
  //   this.getVehiculosPaginated();
  // }

  // cambiarLimite() {
  //   this.limit = Number(this.limit);
  //   this.page = 1;
  //   this.getVehiculosPaginated();
  // }


  // getTipoIcon(
  //   tipo: TipoVehiculo,
  // ): string {
  //   const icons:
  //     Record<TipoVehiculo, string> = {
  //     CAMION_COMPACTADOR:
  //       'fa-truck',

  //     CAMION_BARANDA:
  //       'fa-truck-pickup',

  //     CAMION_VOLQUETE:
  //       'fa-truck-moving',

  //     MOTOFURGON:
  //       'fa-motorcycle',

  //     OTRO:
  //       'fa-car-side',
  //   };

  //   return icons[tipo] ??
  //     'fa-truck';
  // }


  getEstadoOperativoClass(estado: string): {
    label: string;
    class: string;
  } {
    const map: Record<string, {
      label: string;
      class: string;
    }> = {
      DISPONIBLE: {
        label: 'DISPONIBLE',
        class: 'badge-info'
      },
      ASIGNADO: {
        label: 'ASIGNADO',
        class: 'badge-primary'
      },
      EN_RUTA: {
        label: 'ASIGNADO',
        class: 'badge-success'
      },
      EN_MANTENIMIENTO: {
        label: 'MANTENIMIENTO',
        class: 'badge-accent'
      },
      FUERA_DE_SERVICIO: {
        label: 'FUERA_DE_SERVICIO',
        class: 'badge-error'
      }
    };

    return map[estado] || {
      label: estado,
      class: 'badge-neutral'
    };
  }

  // limpiarFiltros(): void {
  //   this.searchBusqueda = '';
  //   this.estadoOperativoBusqueda = '';
  //   this.tipoVehiculoBusqueda = '';
  //   this.page = 1;

  //   this.getVehiculosPaginated();
  // }

  // ================================
  // Modales methods
  // ================================
  // abrirModal() {
  //   this.modoEdicion = false;
  //   this.vehiculoSeleccionado = null;
  //   this.mostrarModal = true;
  // }

  // cerrarModal() {
  //   this.mostrarModal = false;
  // }

  // cerrarModalInfo() {
  //   this.mostrarModalView = false;
  //   this.vehiculo_id = null;
  // }
}
