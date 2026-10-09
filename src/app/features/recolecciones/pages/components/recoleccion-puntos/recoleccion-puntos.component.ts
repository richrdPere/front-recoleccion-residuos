import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

// Service
import { RecoleccionesService } from '../../../services/recolecciones.service';

// Interfaces
import { PuntoRecorridoData, PuntoRecorridoRecoleccion } from '../../../interfaces';

@Component({
  selector: 'recoleccion-puntos',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
  ],
  templateUrl: './recoleccion-puntos.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoleccionPuntosComponent implements OnChanges, OnDestroy {

  // ================================
  // Inputs / Outputs
  // ================================
  @Input() idRecorrido: number | null = null;
  @Input() actualizacion = 0;

  @Output() verRecoleccion = new EventEmitter<number>();
  @Output() verEvidencias = new EventEmitter<number>();

  @Output() anularRecoleccion =
    new EventEmitter<PuntoRecorridoRecoleccion>();

  // ================================
  // Puntos
  // ================================
  puntos: PuntoRecorridoData[] = [];
  puntosFiltrados: PuntoRecorridoData[] = [];
  puntosPaginados: PuntoRecorridoData[] = [];

  isLoading = false;
  errorCarga: string | null = null;

  // Search / filtros
  searchBusqueda = '';

  filtroTipo: PuntoRecorridoData['tipo_punto'] | '' = '';
  filtroAtencion: PuntoRecorridoData['estado_atencion'] | '' = '';
  filtroObligatorio: boolean | null = null;

  searchTimeout?: ReturnType<typeof setTimeout>;

  readonly tiposPunto: PuntoRecorridoData['tipo_punto'][] = [
    'INICIO',
    'RECOLECCION',
    'DESCARGA',
    'FINAL',
    'REFERENCIA',
  ];

  // Paginado local
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  private consulta?: Subscription;
  private destruido = false;

  constructor(
    private recoleccionesService: RecoleccionesService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idRecorrido']) {
      this.reiniciarFiltros();
    }

    if (
      changes['idRecorrido'] ||
      changes['actualizacion']
    ) {
      this.getPuntosRecorrido();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;

    clearTimeout(this.searchTimeout);
    this.consulta?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================
  getPuntosRecorrido(): void {
    this.consulta?.unsubscribe();
    clearTimeout(this.searchTimeout);

    this.isLoading = false;
    this.errorCarga = null;
    this.vaciarListado();

    const id = this.idRecorrido;

    if (id === null) {
      this.cdr.markForCheck();
      return;
    }

    if (!Number.isSafeInteger(id) || id <= 0) {
      this.errorCarga =
        'El identificador del recorrido no es válido.';
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.consulta = this.recoleccionesService
      .getPuntosRecorrido(id)
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
          if (!response.success) {
            this.errorCarga =
              response.message ||
              'No se pudieron obtener los puntos del recorrido.';
            return;
          }

          this.puntos = [...(response.data ?? [])].sort(
            (a, b) =>
              a.orden - b.orden ||
              a.id_ruta_punto - b.id_ruta_punto,
          );

          this.aplicarFiltros();
        },
        error: (error: unknown) => {
          this.errorCarga = this.obtenerMensajeError(error);
        },
      });
  }

  abrirDetalle(punto: PuntoRecorridoData): void {
    if (this.isLoading || !punto.recoleccion) {
      return;
    }

    this.verRecoleccion.emit(
      punto.recoleccion.id_recoleccion,
    );
  }

  abrirEvidencias(punto: PuntoRecorridoData): void {
    if (this.isLoading || !punto.recoleccion) {
      return;
    }

    this.verEvidencias.emit(
      punto.recoleccion.id_recoleccion,
    );
  }

  abrirAnulacion(punto: PuntoRecorridoData): void {
    const recoleccion = punto.recoleccion;

    if (
      this.isLoading ||
      !recoleccion ||
      recoleccion.id_recorrido !== this.idRecorrido ||
      recoleccion.fecha_anulacion !== null
    ) {
      return;
    }

    this.anularRecoleccion.emit({ ...recoleccion });
  }

  // ================================
  // Helpers methods
  // ================================
  aplicarFiltros(): void {
    const busqueda = this.searchBusqueda.trim().toUpperCase();

    this.puntosFiltrados = this.puntos.filter((punto) => {
      const texto = [
        punto.codigo ?? '',
        punto.nombre,
        punto.descripcion ?? '',
      ].join(' ').toUpperCase();

      return (
        (!busqueda || texto.includes(busqueda)) &&
        (!this.filtroTipo || punto.tipo_punto === this.filtroTipo) &&
        (
          !this.filtroAtencion ||
          punto.estado_atencion === this.filtroAtencion
        ) &&
        (
          this.filtroObligatorio === null ||
          punto.obligatorio === this.filtroObligatorio
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
    this.reiniciarFiltros();
    this.aplicarFiltros();
  }

  private reiniciarFiltros(): void {
    clearTimeout(this.searchTimeout);

    this.searchBusqueda = '';
    this.filtroTipo = '';
    this.filtroAtencion = '';
    this.filtroObligatorio = null;

    this.page = 1;
    this.currentPage = 1;
  }

  private vaciarListado(): void {
    this.puntos = [];
    this.puntosFiltrados = [];
    this.puntosPaginados = [];

    this.totalItems = 0;
    this.totalPages = 0;
  }

  private obtenerMensajeError(error: unknown): string {
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
      : 'No se pudieron obtener los puntos del recorrido.';
  }
}
