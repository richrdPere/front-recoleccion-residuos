import { CommonModule, DatePipe, } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Service
import { PersonalService } from '../../services/personal.service';
import { EstadoLaboralPersonal, PersonalOperativoData, PersonalPaginadoFilters, TipoContratoPersonal } from '../../models';

@Component({
  selector: 'app-personal-page',
  imports: [
    DatePipe,
    FormsModule,
    CommonModule,
    UppercaseDirective,
  ],
  templateUrl: './personal-page.component.html',
  styles: ``,
})
export class PersonalPageComponent implements OnInit {

  // Personal
  personal: PersonalOperativoData[] = [];
  personal_id: number | null = null;
  isLoading = true;

  mostrarModal = false;
  mostrarModalView = false;
  modoEdicion = false;
  personalSeleccionado: any = null;

  searchTimeout: any;

  // Search
  searchBusqueda: string = '';
  estadoLaboralBusqueda: EstadoLaboralPersonal | '' = '';
  tipoContratoBusqueda: TipoContratoPersonal | '' = '';

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  constructor(
    private personalService: PersonalService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.getPersonalPaginated();
  }

  // ================================
  // Methods
  // ================================
  getPersonalPaginated() {
    const params: PersonalPaginadoFilters = {
      page: this.page,
      limit: this.limit,
      search: this.searchBusqueda,
      estado_laboral: this.estadoLaboralBusqueda || undefined,
      tipo_contrato: this.tipoContratoBusqueda || undefined,
    };

    this.isLoading = true;

    this.personalService.getPersonalPaginated(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {

          const paginacion = res.data;

          this.personal = paginacion.items;
          this.totalItems = paginacion.total;
          this.currentPage = paginacion.page;

          this.page = paginacion.page;
          this.limit = paginacion.limit;
          this.totalPages = paginacion.total_pages;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;

          this.personal = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      });
  }

  // - Eliminar personal
  eliminarPersonal(personal: PersonalOperativoData) {
    Swal.fire({
      title: '¿Eliminar unidad?',
      text: `Se eliminará el personal con codigo ${personal.codigo_empleado}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {

      if (result.isConfirmed) {

        this.personalService.deletePersonalOperativo(personal.id_personal)
          .subscribe({
            next: () => {

              Swal.fire({
                icon: 'success',
                title: 'Personal eliminado',
                text: 'El personal fue eliminado correctamente',
                timer: 2000,
                showConfirmButton: false
              });

              this.getPersonalPaginated();
            },
            error: (err) => {

              console.error(err);

              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el personal'
              });

            }
          });
      }
    });
  }

  // Editar personal
  editarPersonal(personal: PersonalOperativoData) {
    this.modoEdicion = true;
    this.personalSeleccionado = { ...personal };
    this.mostrarModal = true;
  }

  // Ver personal
  verPersonal(personal: PersonalOperativoData) {
    this.personal_id = personal.id_personal;
    this.mostrarModalView = true;
  }

  // CAMBIAR ESTADO
  cambiarEstado(personal: PersonalOperativoData) {

    // TODO:
    // this.personalService.changeEstadoPersonalOperativo(personal.id_personal, 'ACTIVO')
    //   .subscribe({
    //     next: (res) => {

    //       personal.estado = res.data.estado;

    //       Swal.fire({
    //         icon: 'success',
    //         title: res.message,
    //         timer: 1500,
    //         showConfirmButton: false
    //       });
    //     },
    //     error: (err) => console.error(err)
    //   });

  }

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
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getPersonalPaginated();
    }, 300);
  }

  onPageSizeChange() {
    this.currentPage = 1; // vuelve a la primera página
  }

  onFiltroChange() {
    this.page = 1;
    this.getPersonalPaginated();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.getPersonalPaginated();
  }

  cambiarLimite() {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getPersonalPaginated();
  }


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

  limpiarFiltros(): void {
    this.searchBusqueda = '';
    this.estadoLaboralBusqueda = '';
    this.tipoContratoBusqueda = '';
    this.page = 1;

    this.getPersonalPaginated();
  }

  // ================================
  // Modales methods
  // ================================
  abrirModal() {
    this.modoEdicion = false;
    this.personalSeleccionado = null;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  cerrarModalInfo() {
    this.mostrarModalView = false;
    this.personal_id = null;
  }
}
