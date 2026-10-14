import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subject, Subscription, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Services
import { RutasServices } from '../../services/rutas.service';

// Interfaces
import { RutaPaginadaItem, RutaZonaData, RutasPaginadasFilters } from '../../interfaces/rutas/get-rutas-paginated.interface';
import { RutaData, RutaVersionConPuntosData, ZonaConResumenRutasData, ZonasResumenRutasPaginadasFilters } from '../../interfaces/rutas';


type EstadoRuta = 'BORRADOR' | 'ACTIVA' | 'INACTIVA';

@Component({
  selector: 'app-rutas-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UppercaseDirective,

  ],
  templateUrl: './rutas-page.component.html',
  styles: ``,
})
export class RutasPageComponent implements OnInit, OnDestroy {

  // *********************************************************
  // EXPEDIENTES DE ZONAS
  // *********************************************************
  zonas: ZonaConResumenRutasData[] = [];
  zona_id: number | null = null;

  isLoading = false;
  errorMensaje = '';

  // Bloquea acciones repetidas sobre un mismo registro.
  readonly registrosProcesando = new Set<number>();

  private readonly destroy$ = new Subject<void>();
  private expedientesSubscription?: Subscription;
  private searchTimeout?: ReturnType<typeof setTimeout>;
  private destruido = false;

  // Search
  searchBusqueda = '';
  estadoBusqueda: boolean | null = null;
  // zonaBusqueda: number | null = null;
  // estadoRutaBusqueda: EstadoRuta | '' = '';


  // ============================================================
  // SELECTED
  // ============================================================
  readonly estados: {
    value: boolean;
    label: string;
  }[] = [
      { value: true, label: 'ACTIVOS' },
      { value: false, label: 'INACTIVOS' },
    ];

  // ============================================================
  // PAGINACIÓN
  // ============================================================

  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  hasNextPage = false;
  hasPreviousPage = false;

  readonly pageSizeOptions = [5, 10, 20, 50];

  constructor(
    private readonly router: Router,
    private readonly rutasService: RutasServices,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // *********************************************************
  // 1. INICIALIZAR
  // *********************************************************
  ngOnInit(): void {
    // this.getRutasPaginated();
    this.getZonasResumenPaginated();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarBusquedaPendiente();
    this.expedientesSubscription?.unsubscribe();
  }

  // ============================================================
  // LISTADO
  // ============================================================
  getZonasResumenPaginated(): void {
    this.expedientesSubscription?.unsubscribe();

    const filters: ZonasResumenRutasPaginadasFilters = {
      page: this.page,
      limit: this.limit,
      search: this.searchBusqueda.trim() || undefined,
      sort_by: 'id_zona',
      sort_order: 'DESC',
    };

    this.isLoading = true;
    this.errorMensaje = '';
    this.cdr.markForCheck();

    this.expedientesSubscription = this.rutasService
      .getZonasResumenRutasPaginated(filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.limpiarListado();

            this.errorMensaje =
              response.message ||
              'No se pudieron obtener los expedientes.';

            this.cdr.markForCheck();
            return;
          }

          const { items, pagination } = response.data;

          this.zonas = items;

          this.totalItems = pagination.total;
          this.totalPages = pagination.total_pages;

          this.page = pagination.page;
          this.currentPage = pagination.page;
          this.limit = pagination.limit;

          this.hasNextPage = pagination.has_next_page;
          this.hasPreviousPage = pagination.has_previous_page;

          this.cdr.markForCheck();
        },
        error: (error) => {
          this.limpiarListado();

          this.errorMensaje =
            error?.error?.message ||
            error?.message ||
            'No se pudieron obtener los expedientes.';

          this.cdr.markForCheck();

          void Swal.fire({
            icon: 'error',
            title: 'No se pudieron cargar los expedientes',
            text: this.errorMensaje,
          });
        },
      });
  }

  private limpiarListado(): void {
    this.zonas = [];
    this.totalItems = 0;
    this.totalPages = 0;
  }

  // ============================================================
  // ABRIR RUTAS DE LA ZONA
  // ============================================================
  abrirRutasZona(zona: ZonaConResumenRutasData): void {
    // this.vehiculoExpedienteSeleccionado = vehiculo;

    if (zona.id_zona === null ||
      zona.id_zona === undefined) {
      return;
    }

    void this.router.navigate(
      [
        '/admin',
        'rutas',
        zona.id_zona,
      ],
      {
        state: {
          zona: zona,
          poligono_geojson: zona.poligono_geojson
        },
      },
    );
  }

  // async eliminarRuta(ruta: RutaPaginadaItem): Promise<void> {
  //   if (this.estaProcesando(ruta.id_ruta)) {
  //     return;
  //   }

  //   this.registrosProcesando.add(ruta.id_ruta);

  //   try {
  //     const resultado = await Swal.fire({
  //       icon: 'warning',
  //       title: '¿Eliminar ruta?',
  //       text: `Se eliminará la ruta ${ruta.codigo}: ${ruta.nombre}.`,
  //       showCancelButton: true,
  //       confirmButtonText: 'Sí, eliminar',
  //       cancelButtonText: 'Cancelar',
  //       confirmButtonColor: '#d33',
  //     });

  //     if (!resultado.isConfirmed || this.destruido) {
  //       this.registrosProcesando.delete(ruta.id_ruta);
  //       return;
  //     }

  //     // En tu servicio este método aún se llama deleteVehiculo.
  //     this.rutasService.deleteRuta(ruta.id_ruta)
  //       .pipe(
  //         takeUntilDestroyed(this.destroyRef),
  //         finalize(() => this.finalizarAccion(ruta.id_ruta)),
  //       )
  //       .subscribe({
  //         next: (response) => {
  //           if (!response.success) {
  //             this.mostrarError(
  //               response.message || 'No se pudo eliminar la ruta.',
  //             );
  //             return;
  //           }

  //           this.mostrarExito(
  //             response.message || 'Ruta eliminada correctamente.',
  //           );

  //           this.getRutasPaginated();
  //         },

  //         error: (error) => {
  //           this.mostrarError(
  //             this.obtenerMensajeError(
  //               error,
  //               'No se pudo eliminar la ruta.',
  //             ),
  //           );
  //         },
  //       });
  //   } catch {
  //     this.finalizarAccion(ruta.id_ruta);
  //   }
  // }

  // ============================================================
  // CAMBIAR ESTADO DEL REGISTRO
  // ============================================================

  // cambiarEstado(ruta: RutaPaginadaItem): void {
  //   if (this.estaProcesando(ruta.id_ruta)) {
  //     return;
  //   }

  //   this.registrosProcesando.add(ruta.id_ruta);

  //   this.rutasService
  //     .changeRutaEstado(ruta.id_ruta, {
  //       estado: !ruta.estado,
  //     })
  //     .pipe(
  //       takeUntilDestroyed(this.destroyRef),
  //       finalize(() => this.finalizarAccion(ruta.id_ruta)),
  //     )
  //     .subscribe({
  //       next: (response) => {
  //         if (!response.success) {
  //           this.mostrarError(
  //             response.message || 'No se pudo cambiar el estado.',
  //           );
  //           return;
  //         }

  //         this.mostrarExito(
  //           response.message || 'Estado actualizado correctamente.',
  //         );

  //         // Recarga para respetar los filtros activos.
  //         this.getRutasPaginated();
  //       },

  //       error: (error) => {
  //         this.mostrarError(
  //           this.obtenerMensajeError(
  //             error,
  //             'No se pudo cambiar el estado del registro.',
  //           ),
  //         );
  //       },
  //     });
  // }

  // ============================================================
  // CAMBIAR ESTADO OPERATIVO
  // ============================================================
  // async cambiarEstadoOperativo(
  //   ruta: RutaPaginadaItem,
  // ): Promise<void> {
  //   if (this.estaProcesando(ruta.id_ruta)) {
  //     return;
  //   }

  //   this.registrosProcesando.add(ruta.id_ruta);

  //   try {
  //     const resultado = await Swal.fire({
  //       title: 'Cambiar estado de la ruta',
  //       text: `${ruta.codigo} — ${ruta.nombre}`,
  //       input: 'select',
  //       inputOptions: {
  //         BORRADOR: 'Borrador',
  //         ACTIVA: 'Activa',
  //         INACTIVA: 'Inactiva',
  //       },
  //       inputValue: ruta.estado_ruta,
  //       showCancelButton: true,
  //       confirmButtonText: 'Actualizar',
  //       cancelButtonText: 'Cancelar',
  //       inputValidator: (value) => {
  //         return this.estadosRuta.some(
  //           (opcion) => opcion.value === value,
  //         )
  //           ? undefined
  //           : 'Selecciona un estado válido.';
  //       },
  //     });

  //     if (
  //       !resultado.isConfirmed ||
  //       this.destruido ||
  //       resultado.value === ruta.estado_ruta
  //     ) {
  //       this.registrosProcesando.delete(ruta.id_ruta);
  //       return;
  //     }

  //     const estado = this.estadosRuta.find(
  //       (opcion) => opcion.value === resultado.value,
  //     )?.value;

  //     if (!estado) {
  //       this.finalizarAccion(ruta.id_ruta);
  //       return;
  //     }

  //     this.rutasService
  //       .changeRutaEstadoOperativo(ruta.id_ruta, {
  //         estado_ruta: estado,
  //       })
  //       .pipe(
  //         takeUntilDestroyed(this.destroyRef),
  //         finalize(() => this.finalizarAccion(ruta.id_ruta)),
  //       )
  //       .subscribe({
  //         next: (response) => {
  //           if (!response.success) {
  //             this.mostrarError(
  //               response.message || 'No se pudo actualizar la ruta.',
  //             );
  //             return;
  //           }

  //           this.mostrarExito(
  //             response.message || 'Estado operativo actualizado.',
  //           );

  //           this.getRutasPaginated();
  //         },

  //         error: (error) => {
  //           this.mostrarError(
  //             this.obtenerMensajeError(
  //               error,
  //               'No se pudo cambiar el estado operativo.',
  //             ),
  //           );
  //         },
  //       });
  //   } catch {
  //     this.finalizarAccion(ruta.id_ruta);
  //   }
  // }

  // ============================================================
  // VERSION RUTAS
  // ============================================================
  // abrirVersionesRuta(ruta: RutaPaginadaItem) {
  //   this.rutaVersionesId = ruta.id_ruta;


  // }

  // ============================================================
  // HORARIOS RUTAS
  // ============================================================
  // abrirHorarios(idRuta: number): void {
  //   this.rutaHorariosId = idRuta;
  //   this.mostrarModalHorarios = true;
  // }

  // cerrarHorarios(): void {
  //   this.mostrarModalHorarios = false;
  //   this.rutaHorariosId = null;
  // }



  // ============================================================
  // FILTROS / PAGINACIÓN
  // ============================================================
  onSearchChange(): void {
    this.cancelarBusquedaPendiente();

    this.searchTimeout = setTimeout(() => {
      this.searchTimeout = undefined;
      this.page = 1;
      this.getZonasResumenPaginated();
    }, 300);
  }

  onFiltroChange(): void {
    this.cancelarBusquedaPendiente();
    this.page = 1;
    this.getZonasResumenPaginated();
  }

  cambiarLimite(): void {
    this.cancelarBusquedaPendiente();
    this.limit = Number(this.limit);
    this.page = 1;
    this.getZonasResumenPaginated();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (
      this.isLoading ||
      nuevaPagina < 1 ||
      nuevaPagina > this.totalPages
    ) {
      return;
    }

    this.cancelarBusquedaPendiente();
    this.page = nuevaPagina;
    this.getZonasResumenPaginated();
  }

  limpiarFiltros(): void {
    this.cancelarBusquedaPendiente();

    this.searchBusqueda = '';
    this.page = 1;

    this.getZonasResumenPaginated();
  }

  get hayFiltros(): boolean {
    return !!(
      this.searchBusqueda.trim()
    );
  }

  private cancelarBusquedaPendiente(): void {
    if (this.searchTimeout !== undefined) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = undefined;
    }
  }

  // ============================================================
  // FORMULARIO / DETALLE
  // ============================================================
  // abrirModal(): void {
  //   this.modoEdicion = false;
  //   this.rutaSeleccionada = null;
  //   this.mostrarModal = true;
  // }

  // abrirEdicion(ruta: RutaPaginadaItem): void {
  //   this.modoEdicion = true;
  //   this.rutaSeleccionada = { ...ruta };
  //   this.mostrarModal = true;
  // }

  // abrirDetalle(ruta: RutaPaginadaItem): void {
  //   this.ruta_id = ruta.id_ruta;
  //   this.mostrarModalView = true;
  // }

  // cerrarModalInfo(): void {
  //   this.mostrarModalView = false;
  //   this.ruta_id = null;
  // }

  // // Llamar después de crear o editar correctamente.
  // onRutaGuardada(): void {
  //   this.getRutasPaginated();
  // }

  // cerrarModal(): void {
  //   this.mostrarModal = false;
  //   this.modoEdicion = false;
  //   this.rutaSeleccionada = null;
  // }

  // // ============================================================
  // // RUTA VERSIONES
  // // ============================================================
  // abrirVersiones(idRuta: number): void {
  //   this.rutaVersionesId = idRuta;
  //   this.mostrarModalVersiones = true;
  // }

  // cerrarVersiones(): void {
  //   this.mostrarModalVersiones = false;
  //   this.rutaVersionesId = null;
  // }

  // gestionarPuntosVersion(
  //   version: RutaVersionConPuntosData,
  // ): void {
  //   this.versionParaPuntos = version;

  //   // Aquí conectarás la apertura de RutaPuntosComponent.
  // }
  // ============================================================
  // HELPERS
  // ============================================================

  estaProcesando(idRuta: number): boolean {
    return this.registrosProcesando.has(idRuta);
  }

  private finalizarAccion(idRuta: number): void {
    this.registrosProcesando.delete(idRuta);

    if (!this.destruido) {
      this.cdr.markForCheck();
    }
  }

  getEstadoRutaClass(estado: string): {
    label: string;
    class: string;
  } {
    const estados: Record<string, { label: string; class: string }> = {
      BORRADOR: { label: 'Borrador', class: 'badge-warning' },
      ACTIVA: { label: 'Activa', class: 'badge-success' },
      INACTIVA: { label: 'Inactiva', class: 'badge-neutral' },
    };

    return estados[estado] ?? {
      label: estado,
      class: 'badge-neutral',
    };
  }

  getDistancia(ruta: RutaPaginadaItem): number | null {
    const value = ruta.version_vigente?.distancia_estimada_km;

    if (value === null || value === undefined || value.trim() === '') {
      return null;
    }

    const distancia = Number(value);

    return Number.isFinite(distancia) ? distancia : null;
  }

  private obtenerMensajeError(
    error: unknown,
    fallback: string,
  ): string {
    const detalle = error as {
      message?: unknown;
      error?: { message?: unknown };
    } | null;

    const mensaje = detalle?.error?.message ?? detalle?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : fallback;
  }

  private mostrarError(mensaje: string): void {
    void Swal.fire({
      icon: 'error',
      title: 'No se pudo completar la operación',
      text: mensaje,
    });
  }

  private mostrarExito(mensaje: string): void {
    void Swal.fire({
      icon: 'success',
      title: mensaje,
      timer: 1500,
      showConfirmButton: false,
    });
  }
}
