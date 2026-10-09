import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import {
  UppercaseDirective
} from 'src/app/shared/directives/uppercase.directive';

// Service
import { RutaVersionPuntoService } from '../../services/ruta-version-punto.service';

// Interfaces
import { RutaPuntoData, RutaVersionConPuntosData } from '../../interfaces/rutas';
import { ReorderRutaPuntosRequest, TipoRutaPunto } from '../../interfaces/ruta-puntos';

// Componente
import { RutaPuntoFormComponent } from './ruta-punto-form/ruta-punto-form.component';

@Component({
  selector: 'ruta-puntos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UppercaseDirective,
    RutaPuntoFormComponent,
  ],
  templateUrl: './ruta-punto.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutaPuntoComponent implements OnChanges, OnDestroy {

  // ================================
  // Inputs / Outputs
  // ================================
  @Input() version: RutaVersionConPuntosData | null = null;
  @Output() crearPunto = new EventEmitter<number>();
  @Output() editarPunto = new EventEmitter<RutaPuntoData>();

  // El padre vuelve a consultar las versiones y entrega
  // nuevamente la versión seleccionada.
  @Output() puntosActualizados = new EventEmitter<void>();

  // ================================
  // Datos
  // ================================
  puntos: RutaPuntoData[] = [];
  puntosFiltrados: RutaPuntoData[] = [];
  puntosPaginados: RutaPuntoData[] = [];

  idRutaVersion: number | null = null;
  isSaving = false;

  mostrarModal = false;
  modoEdicion = false;
  puntoSeleccionado: RutaPuntoData | null = null;
  ordenSugerido = 1;

  // Search / filtros
  searchBusqueda = '';
  filtroTipo: TipoRutaPunto | '' = '';
  filtroEstado: boolean | null = null;

  searchTimeout?: ReturnType<typeof setTimeout>;

  readonly tiposPunto: TipoRutaPunto[] = [
    'INICIO',
    'RECOLECCION',
    'DESCARGA',
    'FINAL',
    'REFERENCIA',
  ];

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  // Control de suscripciones
  private readonly destroy$ = new Subject<void>();
  private destruido = false;

  constructor(
    private puntosService: RutaVersionPuntoService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['version']) {
      return;
    }

    clearTimeout(this.searchTimeout);

    this.idRutaVersion = this.version?.id_ruta_version ?? null;

    // Copiamos los datos para no modificar el Input del padre.
    this.puntos = [...(this.version?.puntos ?? [])]
      .map((punto) => ({ ...punto }))
      .sort(
        (a, b) =>
          a.orden - b.orden ||
          a.id_ruta_punto - b.id_ruta_punto,
      );

    this.page = 1;
    this.aplicarFiltros();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    clearTimeout(this.searchTimeout);

    this.destroy$.next();
    this.destroy$.complete();
  }

  // ================================
  // Methods
  // ================================
  abrirNuevoPunto(): void {
    if (this.idRutaVersion === null || this.isSaving) {
      return;
    }

    this.modoEdicion = false;
    this.puntoSeleccionado = null;

    this.ordenSugerido = this.puntos.length
      ? Math.max(...this.puntos.map((punto) => punto.orden)) + 1
      : 1;

    this.mostrarModal = true;
  }

  abrirEditarPunto(punto: RutaPuntoData): void {
    if (this.isSaving) {
      return;
    }

    this.modoEdicion = true;
    this.puntoSeleccionado = { ...punto };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.puntoSeleccionado = null;
  }

  onPuntoGuardado(): void {
    this.cerrarModal();
    this.puntosActualizados.emit();
  }

  async eliminarPunto(punto: RutaPuntoData): Promise<void> {
    if (this.idRutaVersion === null || this.isSaving) {
      return;
    }

    const idVersion = this.idRutaVersion;
    this.isSaving = true;
    this.cdr.markForCheck();

    try {
      const resultado = await Swal.fire({
        title: '¿Eliminar punto?',
        text: `Se eliminará el punto ${punto.codigo}: ${punto.nombre}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        reverseButtons: true,
        focusCancel: true,
        showLoaderOnConfirm: true,

        allowOutsideClick: () => !Swal.isLoading(),
        allowEscapeKey: () => !Swal.isLoading(),

        preConfirm: async () => {
          try {
            const response = await firstValueFrom(
              this.puntosService
                .deleteRutaPunto(idVersion, punto.id_ruta_punto)
                .pipe(takeUntil(this.destroy$)),
            );

            if (!response.success) {
              Swal.showValidationMessage(
                response.message || 'No se pudo eliminar el punto.',
              );
              return false;
            }

            return response;
          } catch (error: unknown) {
            if (!this.destruido) {
              Swal.showValidationMessage(
                this.obtenerMensajeError(
                  error,
                  'No se pudo eliminar el punto.',
                ),
              );
            }

            return false;
          }
        },
      });

      if (
        this.destruido ||
        !resultado.isConfirmed ||
        !resultado.value
      ) {
        return;
      }

      // Actualizamos solo si seguimos mostrando la misma versión.
      if (this.idRutaVersion === idVersion) {
        this.puntos = this.puntos.filter(
          (item) => item.id_ruta_punto !== punto.id_ruta_punto,
        );

        this.aplicarFiltros();
      }

      this.puntosActualizados.emit();

      void Swal.fire({
        icon: 'success',
        title: 'Punto eliminado',
        text: resultado.value.message,
        timer: 1800,
        showConfirmButton: false,
      });
    } finally {
      this.isSaving = false;

      if (!this.destruido) {
        this.cdr.markForCheck();
      }
    }
  }

  async moverPunto(
    punto: RutaPuntoData,
    direccion: -1 | 1,
  ): Promise<void> {
    if (
      this.idRutaVersion === null ||
      this.isSaving ||
      this.tieneFiltrosActivos()
    ) {
      return;
    }

    const indice = this.puntos.findIndex(
      (item) => item.id_ruta_punto === punto.id_ruta_punto,
    );

    const destino = indice + direccion;

    if (
      indice < 0 ||
      destino < 0 ||
      destino >= this.puntos.length
    ) {
      return;
    }

    const idVersion = this.idRutaVersion;
    const nuevoOrden = [...this.puntos];

    [nuevoOrden[indice], nuevoOrden[destino]] = [
      nuevoOrden[destino],
      nuevoOrden[indice],
    ];

    // Se envían todos los puntos con orden consecutivo.
    const request: ReorderRutaPuntosRequest = {
      puntos: nuevoOrden.map((item, posicion) => ({
        id_ruta_punto: item.id_ruta_punto,
        orden: posicion + 1,
      })),
    };

    this.isSaving = true;
    this.cdr.markForCheck();

    try {
      const resultado = await Swal.fire({
        icon: 'question',
        title: '¿Cambiar orden del punto?',
        text: `El punto ${punto.codigo} ocupará la posición ${destino + 1}.`,
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        showLoaderOnConfirm: true,

        allowOutsideClick: () => !Swal.isLoading(),
        allowEscapeKey: () => !Swal.isLoading(),

        preConfirm: async () => {
          try {
            const response = await firstValueFrom(
              this.puntosService
                .reorderRutaPuntos(idVersion, request)
                .pipe(takeUntil(this.destroy$)),
            );

            if (!response.success) {
              Swal.showValidationMessage(
                response.message || 'No se pudo cambiar el orden.',
              );
              return false;
            }

            return response;
          } catch (error: unknown) {
            if (!this.destruido) {
              Swal.showValidationMessage(
                this.obtenerMensajeError(
                  error,
                  'No se pudo cambiar el orden.',
                ),
              );
            }

            return false;
          }
        },
      });

      if (
        this.destruido ||
        !resultado.isConfirmed ||
        !resultado.value
      ) {
        return;
      }

      // Solicita los datos confirmados por el backend.
      this.puntosActualizados.emit();

      void Swal.fire({
        icon: 'success',
        title: 'Orden actualizado',
        text: resultado.value.message,
        timer: 1800,
        showConfirmButton: false,
      });
    } finally {
      this.isSaving = false;

      if (!this.destruido) {
        this.cdr.markForCheck();
      }
    }
  }

  puedeMover(
    punto: RutaPuntoData,
    direccion: -1 | 1,
  ): boolean {
    if (this.isSaving || this.tieneFiltrosActivos()) {
      return false;
    }

    const indice = this.puntos.findIndex(
      (item) => item.id_ruta_punto === punto.id_ruta_punto,
    );

    const destino = indice + direccion;

    return indice >= 0 &&
      destino >= 0 &&
      destino < this.puntos.length;
  }

  // ================================
  // Helpers methods
  // ================================
  aplicarFiltros(): void {
    const busqueda = this.searchBusqueda.trim().toUpperCase();

    this.puntosFiltrados = this.puntos.filter((punto) => {
      const texto = [
        punto.codigo,
        punto.nombre,
        punto.descripcion ?? '',
      ].join(' ').toUpperCase();

      return (
        (!busqueda || texto.includes(busqueda)) &&
        (!this.filtroTipo || punto.tipo_punto === this.filtroTipo) &&
        (
          this.filtroEstado === null ||
          punto.estado === this.filtroEstado
        )
      );
    });

    this.totalItems = this.puntosFiltrados.length;
    this.totalPages = Math.ceil(this.totalItems / this.limit);

    this.page = Math.min(
      Math.max(this.page, 1),
      Math.max(this.totalPages, 1),
    );

    this.currentPage = this.page;

    const inicio = (this.page - 1) * this.limit;

    this.puntosPaginados = this.puntosFiltrados.slice(
      inicio,
      inicio + this.limit,
    );

    this.cdr.markForCheck();
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.aplicarFiltros();
    }, 300);
  }

  onFiltroChange(): void {
    clearTimeout(this.searchTimeout);
    this.page = 1;
    this.aplicarFiltros();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (
      nuevaPagina < 1 ||
      nuevaPagina > this.totalPages
    ) {
      return;
    }

    this.page = nuevaPagina;
    this.aplicarFiltros();
  }

  cambiarLimite(): void {
    this.limit = Number(this.limit);

    if (!this.pageSizeOptions.includes(this.limit)) {
      this.limit = 5;
    }

    this.page = 1;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    clearTimeout(this.searchTimeout);

    this.searchBusqueda = '';
    this.filtroTipo = '';
    this.filtroEstado = null;
    this.page = 1;

    this.aplicarFiltros();
  }

  tieneFiltrosActivos(): boolean {
    return Boolean(
      this.searchBusqueda.trim() ||
      this.filtroTipo ||
      this.filtroEstado !== null,
    );
  }

  private obtenerMensajeError(
    error: unknown,
    fallback: string,
  ): string {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    const err = error as {
      error?: { message?: unknown } | string;
      message?: unknown;
    } | null;

    const mensajeBackend = typeof err?.error === 'string'
      ? err.error
      : err?.error?.message;

    const mensaje = mensajeBackend ?? err?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : fallback;
  }
}
