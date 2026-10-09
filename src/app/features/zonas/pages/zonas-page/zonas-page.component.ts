import { CommonModule, DatePipe, } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Service
import { ZonasServices } from '../../services/zonas.service';

// Interfaces
import { ZonaData, ZonasPaginadasFilters } from '../../interfaces';

// Componentes
import { ZonaFormComponent } from '../components/zona-form/zona-form.component';
import { ZonaViewComponent } from '../components/zona-view/zona-view.component';

@Component({
  selector: 'app-zonas-page',
  imports: [
    DatePipe,
    FormsModule,
    CommonModule,
    UppercaseDirective,
    ZonaFormComponent,
    ZonaViewComponent
  ],
  templateUrl: './zonas-page.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZonasPageComponent implements OnInit {


  // Zonas
  zonas: ZonaData[] = [];
  zona_id: number | null = null;
  isLoading = true;

  mostrarModal = false;
  mostrarModalView = false;
  modoEdicion = false;
  zonaSeleccionada: any = null;

  searchTimeout: any;

  // Search
  searchBusqueda: string = '';

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  // Estado switch
  readonly zonasCambiandoEstado = new Set<string>();

  // Selectores


  constructor(
    private zonasService: ZonasServices,
    private cdr: ChangeDetectorRef,
  ) { }


  ngOnInit(): void {
    this.getZonasPaginated();
  }

  // ================================
  // Methods
  // ================================
  getZonasPaginated() {
    const params: ZonasPaginadasFilters = {
      page: this.page,
      limit: this.limit,
      search: this.searchBusqueda,
    };

    this.isLoading = true;

    this.zonasService.getZonasPaginated(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {

          const paginacion = res.data;

          this.zonas = paginacion.items;
          this.totalItems = paginacion.total;
          this.currentPage = paginacion.page;

          this.page = paginacion.page;
          this.limit = paginacion.limit;
          this.totalPages = paginacion.total_pages;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;

          this.zonas = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      });
  }

  // - Eliminar vehiculo
  eliminarZona(zona: ZonaData) {
    Swal.fire({
      title: '¿Eliminar zona?',
      text: `Se eliminará la zona ${zona.codigo}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {

      if (result.isConfirmed) {

        this.zonasService.deleteZona(zona.id_zona)
          .subscribe({
            next: () => {

              Swal.fire({
                icon: 'success',
                title: 'Zona eliminada',
                text: 'La zona fue eliminada correctamente',
                timer: 2000,
                showConfirmButton: false
              });

              this.getZonasPaginated();
            },
            error: (err) => {

              console.error(err);

              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar la zona'
              });

            }
          });
      }
    });
  }

  // Editar vehiculo
  editarZona(zona: ZonaData) {
    this.modoEdicion = true;
    this.zonaSeleccionada = { ...zona };
    this.mostrarModal = true;
  }

  // Ver vehiculo
  verZona(zona: ZonaData) {
    this.zona_id = zona.id_zona;
    this.mostrarModalView = true;
  }

  // - CAMBIAR ESTADO
  async cambiarEstado(zona: ZonaData, event: Event): Promise<void> {

    const input = event.target as HTMLInputElement;
    const usuarioId = String(zona.id_zona);

    // El navegador ya cambió el checkbox; restauramos su estado.
    input.checked = zona.estado;

    if (this.zonasCambiandoEstado.has(usuarioId)) {
      return;
    }

    const nuevoEstado = !zona.estado;

    this.zonasCambiandoEstado.add(usuarioId);
    this.cdr.markForCheck();

    try {
      const resultado = await Swal.fire({
        icon: 'warning',
        title: nuevoEstado
          ? '¿Activar zona?'
          : '¿Desactivar zona?',

        text: nuevoEstado
          ? `Se habilitará la zona con código ${zona.codigo}.`
          : `Se deshabilitará la zona con código ${zona.codigo}.`,

        showCancelButton: true,
        confirmButtonText: nuevoEstado
          ? 'Sí, activar'
          : 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: nuevoEstado ? '#16a34a' : '#dc2626',

        reverseButtons: true,
        focusCancel: true,
        showLoaderOnConfirm: true,

        allowOutsideClick: () => !Swal.isLoading(),
        allowEscapeKey: () => !Swal.isLoading(),

        preConfirm: async () => {
          try {
            const response = await firstValueFrom(
              this.zonasService.changeZonaEstado(
                zona.id_zona,
                { estado: nuevoEstado },
              ),
            );

            if (!response.success) {
              Swal.showValidationMessage(
                response.message || 'No se pudo actualizar el estado.',
              );
              return false;
            }

            return response;
          } catch (error: unknown) {
            const err = error as {
              error?: { message?: unknown } | string;
              message?: unknown;
            } | null;

            const mensajeBackend = typeof err?.error === 'string'
              ? err.error
              : err?.error?.message;

            const mensaje = mensajeBackend ?? err?.message;

            Swal.showValidationMessage(
              typeof mensaje === 'string' && mensaje.trim()
                ? mensaje
                : 'Ocurrió un error al actualizar el estado de la zona.',
            );

            return false;
          }
        },
      });

      if (!resultado.isConfirmed || !resultado.value) {
        return;
      }

      // Usa el estado confirmado por el backend.
      zona.estado = resultado.value.data.estado;
      zona.updated_at = resultado.value.data.updated_at;

      input.checked = zona.estado;
      this.cdr.markForCheck();

      void Swal.fire({
        icon: 'success',
        title: zona.estado
          ? 'Zona activada'
          : 'Zona desactivada',
        text: resultado.value.message,
        timer: 1800,
        showConfirmButton: false,
      });
    } finally {
      this.zonasCambiandoEstado.delete(usuarioId);
      this.cdr.markForCheck();
    }
  }

  estaCambiandoEstado(zona: ZonaData): boolean {
    return this.zonasCambiandoEstado.has(String(zona.id_zona));
  }

  // ================================
  // Helpers methods
  // ================================
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getZonasPaginated();
    }, 300);
  }

  onPageSizeChange() {
    this.currentPage = 1; // vuelve a la primera página
  }

  onFiltroChange() {
    this.page = 1;
    this.getZonasPaginated();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.getZonasPaginated();
  }

  cambiarLimite() {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getZonasPaginated();
  }

  limpiarFiltros(): void {
    this.searchBusqueda = '';
    this.page = 1;

    this.getZonasPaginated();
  }

  // ================================
  // Modales methods
  // ================================
  abrirModal() {
    this.modoEdicion = false;
    this.zonaSeleccionada = null;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  cerrarModalInfo() {
    this.mostrarModalView = false;
    this.zona_id = null;
  }
}
