import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';

import Swal from 'sweetalert2';

// Services
import { RutasServices } from '../../services/rutas.service';

// Interfaces
import { RutaPaginadaItem, RutaZonaData, RutasPaginadasFilters } from '../../interfaces/rutas/get-rutas-paginated.interface';
import { RutaData } from '../../interfaces/rutas';

// Componentes
import { RutasFormComponent } from './rutas-form/rutas-form.component';
import { RutasViewComponent } from './rutas-view/rutas-view.component';

type EstadoRuta = 'BORRADOR' | 'ACTIVA' | 'INACTIVA';

@Component({
  selector: 'app-rutas-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RutasFormComponent,
    RutasViewComponent
  ],
  templateUrl: './rutas-page.component.html',
  styles: ``,
})
export class RutasPageComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================
  // SELECTOR DE ZONAS
  // Recibe la lista completa desde tu servicio de zonas.
  // ============================================================

  @Input() zonas: Pick<RutaZonaData, 'id_zona' | 'nombre'>[] = [];

  // ============================================================
  // EVENTOS PARA CONECTAR FORMULARIO / DETALLE
  // ============================================================

  @Output() nuevaRuta = new EventEmitter<void>();
  @Output() editarRuta = new EventEmitter<RutaPaginadaItem>();
  @Output() verRuta = new EventEmitter<number>();

  // ============================================================
  // ESTADO
  // ============================================================

  rutas: RutaPaginadaItem[] = [];

  isLoading = false;
  errorCarga: string | null = null;

  // Bloquea acciones repetidas sobre un mismo registro.
  readonly registrosProcesando = new Set<number>();

  private listadoSubscription?: Subscription;
  private searchTimeout?: ReturnType<typeof setTimeout>;
  private destruido = false;

  mostrarModal = false;
  modoEdicion = false;
  rutaSeleccionada: RutaData | null = null;

  mostrarModalView = false;
  ruta_id: number | null = null;

  // ============================================================
  // FILTROS
  // ============================================================

  searchBusqueda = '';
  zonaBusqueda: number | null = null;
  estadoRutaBusqueda: EstadoRuta | '' = '';
  estadoBusqueda: boolean | null = null;

  // ============================================================
  // PAGINACIÓN
  // ============================================================

  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;

  readonly pageSizeOptions = [5, 10, 20, 50];

  // ============================================================
  // SELECTORES
  // ============================================================

  readonly estadosRuta: {
    value: EstadoRuta;
    label: string;
  }[] = [
      { value: 'BORRADOR', label: 'Borrador' },
      { value: 'ACTIVA', label: 'Activa' },
      { value: 'INACTIVA', label: 'Inactiva' },
    ];

  constructor(
    private readonly rutasService: RutasServices,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.getRutasPaginated();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarBusquedaPendiente();
    this.listadoSubscription?.unsubscribe();
  }

  // ============================================================
  // LISTADO
  // ============================================================

  getRutasPaginated(): void {
    // Cancela la consulta anterior para evitar respuestas atrasadas.
    this.listadoSubscription?.unsubscribe();

    const params: RutasPaginadasFilters = {
      page: this.page,
      limit: this.limit,
      search: this.searchBusqueda.trim() || undefined,
      id_zona: this.zonaBusqueda ?? undefined,
      estado_ruta: this.estadoRutaBusqueda || undefined,

      // Conserva false para filtrar registros inactivos.
      estado: this.estadoBusqueda ?? undefined,
    };

    this.isLoading = true;
    this.errorCarga = null;

    this.listadoSubscription = this.rutasService
      .getRutasPaginated(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;

          if (!this.destruido) {
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.limpiarListado();
            this.errorCarga =
              response.message || 'No se pudieron obtener las rutas.';
            return;
          }

          const paginacion = response.data;

          // Por ejemplo, después de eliminar el último registro
          // de la última página.
          const ultimaPagina = Math.max(1, paginacion.total_pages);

          if (this.page > ultimaPagina) {
            this.page = ultimaPagina;
            this.getRutasPaginated();
            return;
          }

          this.rutas = paginacion.items;
          this.totalItems = paginacion.total;
          this.page = paginacion.page;
          this.limit = paginacion.limit;
          this.totalPages = paginacion.total_pages;
        },

        error: (error) => {
          this.limpiarListado();
          this.errorCarga = this.obtenerMensajeError(
            error,
            'No se pudieron obtener las rutas.',
          );
        },
      });
  }

  private limpiarListado(): void {
    this.rutas = [];
    this.totalItems = 0;
    this.totalPages = 0;
  }

  // ============================================================
  // ELIMINAR
  // ============================================================

  async eliminarRuta(ruta: RutaPaginadaItem): Promise<void> {
    if (this.estaProcesando(ruta.id_ruta)) {
      return;
    }

    this.registrosProcesando.add(ruta.id_ruta);

    try {
      const resultado = await Swal.fire({
        icon: 'warning',
        title: '¿Eliminar ruta?',
        text: `Se eliminará la ruta ${ruta.codigo}: ${ruta.nombre}.`,
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
      });

      if (!resultado.isConfirmed || this.destruido) {
        this.registrosProcesando.delete(ruta.id_ruta);
        return;
      }

      // En tu servicio este método aún se llama deleteVehiculo.
      this.rutasService.deleteRuta(ruta.id_ruta)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.finalizarAccion(ruta.id_ruta)),
        )
        .subscribe({
          next: (response) => {
            if (!response.success) {
              this.mostrarError(
                response.message || 'No se pudo eliminar la ruta.',
              );
              return;
            }

            this.mostrarExito(
              response.message || 'Ruta eliminada correctamente.',
            );

            this.getRutasPaginated();
          },

          error: (error) => {
            this.mostrarError(
              this.obtenerMensajeError(
                error,
                'No se pudo eliminar la ruta.',
              ),
            );
          },
        });
    } catch {
      this.finalizarAccion(ruta.id_ruta);
    }
  }

  // ============================================================
  // CAMBIAR ESTADO DEL REGISTRO
  // ============================================================

  cambiarEstado(ruta: RutaPaginadaItem): void {
    if (this.estaProcesando(ruta.id_ruta)) {
      return;
    }

    this.registrosProcesando.add(ruta.id_ruta);

    this.rutasService
      .changeRutaEstado(ruta.id_ruta, {
        estado: !ruta.estado,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.finalizarAccion(ruta.id_ruta)),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.mostrarError(
              response.message || 'No se pudo cambiar el estado.',
            );
            return;
          }

          this.mostrarExito(
            response.message || 'Estado actualizado correctamente.',
          );

          // Recarga para respetar los filtros activos.
          this.getRutasPaginated();
        },

        error: (error) => {
          this.mostrarError(
            this.obtenerMensajeError(
              error,
              'No se pudo cambiar el estado del registro.',
            ),
          );
        },
      });
  }

  // ============================================================
  // CAMBIAR ESTADO OPERATIVO
  // ============================================================

  async cambiarEstadoOperativo(
    ruta: RutaPaginadaItem,
  ): Promise<void> {
    if (this.estaProcesando(ruta.id_ruta)) {
      return;
    }

    this.registrosProcesando.add(ruta.id_ruta);

    try {
      const resultado = await Swal.fire({
        title: 'Cambiar estado de la ruta',
        text: `${ruta.codigo} — ${ruta.nombre}`,
        input: 'select',
        inputOptions: {
          BORRADOR: 'Borrador',
          ACTIVA: 'Activa',
          INACTIVA: 'Inactiva',
        },
        inputValue: ruta.estado_ruta,
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          return this.estadosRuta.some(
            (opcion) => opcion.value === value,
          )
            ? undefined
            : 'Selecciona un estado válido.';
        },
      });

      if (
        !resultado.isConfirmed ||
        this.destruido ||
        resultado.value === ruta.estado_ruta
      ) {
        this.registrosProcesando.delete(ruta.id_ruta);
        return;
      }

      const estado = this.estadosRuta.find(
        (opcion) => opcion.value === resultado.value,
      )?.value;

      if (!estado) {
        this.finalizarAccion(ruta.id_ruta);
        return;
      }

      this.rutasService
        .changeRutaEstadoOperativo(ruta.id_ruta, {
          estado_ruta: estado,
        })
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.finalizarAccion(ruta.id_ruta)),
        )
        .subscribe({
          next: (response) => {
            if (!response.success) {
              this.mostrarError(
                response.message || 'No se pudo actualizar la ruta.',
              );
              return;
            }

            this.mostrarExito(
              response.message || 'Estado operativo actualizado.',
            );

            this.getRutasPaginated();
          },

          error: (error) => {
            this.mostrarError(
              this.obtenerMensajeError(
                error,
                'No se pudo cambiar el estado operativo.',
              ),
            );
          },
        });
    } catch {
      this.finalizarAccion(ruta.id_ruta);
    }
  }

  // ============================================================
  // FILTROS / PAGINACIÓN
  // ============================================================

  onSearchChange(): void {
    this.cancelarBusquedaPendiente();

    this.searchTimeout = setTimeout(() => {
      this.searchTimeout = undefined;
      this.page = 1;
      this.getRutasPaginated();
    }, 300);
  }

  onFiltroChange(): void {
    this.cancelarBusquedaPendiente();
    this.page = 1;
    this.getRutasPaginated();
  }

  cambiarLimite(): void {
    this.cancelarBusquedaPendiente();
    this.limit = Number(this.limit);
    this.page = 1;
    this.getRutasPaginated();
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
    this.getRutasPaginated();
  }

  limpiarFiltros(): void {
    this.cancelarBusquedaPendiente();

    this.searchBusqueda = '';
    this.zonaBusqueda = null;
    this.estadoRutaBusqueda = '';
    this.estadoBusqueda = null;
    this.page = 1;

    this.getRutasPaginated();
  }

  get hayFiltros(): boolean {
    return !!(
      this.searchBusqueda.trim() ||
      this.zonaBusqueda !== null ||
      this.estadoRutaBusqueda ||
      this.estadoBusqueda !== null
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
  abrirModal(): void {
    this.modoEdicion = false;
    this.rutaSeleccionada = null;
    this.mostrarModal = true;
  }

  abrirEdicion(ruta: RutaPaginadaItem): void {
    this.modoEdicion = true;
    this.rutaSeleccionada = { ...ruta };
    this.mostrarModal = true;
  }

  abrirDetalle(ruta: RutaPaginadaItem): void {
    this.ruta_id = ruta.id_ruta;
    this.mostrarModalView = true;
  }

  cerrarModalInfo(): void {
    this.mostrarModalView = false;
    this.ruta_id = null;
  }

  // Llamar después de crear o editar correctamente.
  onRutaGuardada(): void {
    this.getRutasPaginated();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.rutaSeleccionada = null;
  }
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
