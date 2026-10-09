import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, firstValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { RecoleccionesService } from '../../../services/recolecciones.service';

// Interfaces
import { AnularEvidenciaRequest, RecoleccionEvidenciaItem } from '../../../interfaces';

interface EvidenciaVista extends RecoleccionEvidenciaItem {
  urlVisualizacion: string | null;
}

@Component({
  selector: 'recoleccion-evidencia',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
  ],
  templateUrl: './recoleccion-evidencia.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoleccionEvidenciaComponent
  implements OnChanges, OnDestroy {
  // ================================
  // Inputs / Outputs
  // ================================
  @Input() idRecoleccion: number | null = null;
  @Input() actualizacion = 0;

  // Devuelve el ID de la recolección cuyas evidencias cambiaron.
  @Output() evidenciasActualizadas = new EventEmitter<number>();

  // ================================
  // Evidencias
  // ================================
  evidencias: EvidenciaVista[] = [];
  evidenciasFiltradas: EvidenciaVista[] = [];
  evidenciasPaginadas: EvidenciaVista[] = [];

  isLoading = false;
  errorCarga: string | null = null;

  readonly evidenciasEnOperacion = new Set<number>();
  readonly imagenesConError = new Set<number>();

  // Search / filtros
  searchBusqueda = '';
  filtroTipo: '' | 'IMAGEN' | 'DOCUMENTO' = '';
  filtroEstado: '' | 'ACTIVA' | 'ANULADA' = '';

  searchTimeout?: ReturnType<typeof setTimeout>;

  // Paginado local
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  private consulta?: Subscription;
  private readonly destroy$ = new Subject<void>();
  private destruido = false;

  constructor(
    private recoleccionesService: RecoleccionesService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idRecoleccion']) {
      this.reiniciarFiltros();
    }

    if (
      changes['idRecoleccion'] ||
      changes['actualizacion']
    ) {
      this.getRecoleccionEvidencias();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;

    clearTimeout(this.searchTimeout);
    this.consulta?.unsubscribe();

    this.destroy$.next();
    this.destroy$.complete();
  }

  // ================================
  // Methods
  // ================================
  getRecoleccionEvidencias(): void {
    this.consulta?.unsubscribe();
    clearTimeout(this.searchTimeout);

    this.isLoading = false;
    this.errorCarga = null;
    this.vaciarListado();

    const id = this.idRecoleccion;

    if (id === null) {
      this.cdr.markForCheck();
      return;
    }

    if (!Number.isSafeInteger(id) || id <= 0) {
      this.errorCarga =
        'El identificador de la recolección no es válido.';
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.consulta = this.recoleccionesService
      .getRecoleccionEvidencias(id)
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
              'No se pudieron obtener las evidencias.';
            return;
          }

          this.evidencias = (response.data ?? []).map(
            (evidencia) => ({
              ...evidencia,
              urlVisualizacion: this.obtenerUrlArchivo(
                evidencia.url_archivo,
              ),
            }),
          );

          this.aplicarFiltros();
        },
        error: (error: unknown) => {
          this.errorCarga = this.obtenerMensajeError(
            error,
            'No se pudieron obtener las evidencias.',
          );
        },
      });
  }

  async anularEvidencia(
    evidencia: EvidenciaVista,
  ): Promise<void> {
    if (
      this.idRecoleccion === null ||
      this.isLoading ||
      this.evidenciasEnOperacion.size > 0 ||
      evidencia.estado_evidencia !== 'ACTIVA' ||
      evidencia.id_recoleccion !== this.idRecoleccion
    ) {
      return;
    }

    const idRecoleccion = this.idRecoleccion;
    const idEvidencia = evidencia.id_evidencia;

    this.evidenciasEnOperacion.add(idEvidencia);
    this.cdr.markForCheck();

    try {
      const resultado = await Swal.fire({
        icon: 'warning',
        title: '¿Anular evidencia?',
        text: `Se anulará la evidencia ${evidencia.nombre_original}.`,
        input: 'textarea',
        inputLabel: 'Motivo de anulación',
        inputPlaceholder: 'Describe el motivo de la anulación...',
        inputAttributes: {
          'aria-label': 'Motivo de anulación',
        },

        inputValidator: (valor) => {
          return valor?.trim()
            ? undefined
            : 'Ingresa un motivo válido.';
        },

        showCancelButton: true,
        confirmButtonText: 'Sí, anular',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        reverseButtons: true,
        showLoaderOnConfirm: true,

        allowOutsideClick: () => !Swal.isLoading(),
        allowEscapeKey: () => !Swal.isLoading(),

        preConfirm: async (motivo: string) => {
          if (
            this.destruido ||
            this.idRecoleccion !== idRecoleccion
          ) {
            Swal.showValidationMessage(
              'La recolección seleccionada cambió. Cancela esta operación.',
            );
            return false;
          }

          const request: AnularEvidenciaRequest = {
            motivo_anulacion: motivo.trim(),
          };

          try {
            const response = await firstValueFrom(
              this.recoleccionesService
                .anularEvidencia(idEvidencia, request)
                .pipe(takeUntil(this.destroy$)),
            );

            if (!response.success || !response.data) {
              Swal.showValidationMessage(
                response.message ||
                'No se pudo anular la evidencia.',
              );
              return false;
            }

            return response;
          } catch (error: unknown) {
            if (!this.destruido) {
              Swal.showValidationMessage(
                this.obtenerMensajeError(
                  error,
                  'No se pudo anular la evidencia.',
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

      const actualizada = resultado.value.data;

      if (this.idRecoleccion === idRecoleccion) {
        this.evidencias = this.evidencias.map((item) =>
          item.id_evidencia === actualizada.id_evidencia
            ? {
              ...item,
              ...actualizada,
              // La respuesta de anulación no incluye
              // usuario_registro; conservamos el recibido.
              usuario_registro: item.usuario_registro,
              urlVisualizacion: this.obtenerUrlArchivo(
                actualizada.url_archivo,
              ),
            }
            : item,
        );

        this.aplicarFiltros();
      }

      this.evidenciasActualizadas.emit(idRecoleccion);

      void Swal.fire({
        icon: 'success',
        title: 'Evidencia anulada',
        text: resultado.value.message,
        timer: 1800,
        showConfirmButton: false,
      });
    } finally {
      this.evidenciasEnOperacion.delete(idEvidencia);

      if (!this.destruido) {
        this.cdr.markForCheck();
      }
    }
  }

  registrarErrorImagen(idEvidencia: number): void {
    this.imagenesConError.add(idEvidencia);
    this.cdr.markForCheck();
  }

  // ================================
  // Helpers methods
  // ================================
  aplicarFiltros(): void {
    const busqueda = this.searchBusqueda.trim().toUpperCase();

    this.evidenciasFiltradas = this.evidencias.filter((item) => {
      const texto = [
        item.nombre_original,
        item.descripcion ?? '',
        item.usuario_registro?.username ?? '',
        item.motivo_anulacion ?? '',
      ].join(' ').toUpperCase();

      return (
        (!busqueda || texto.includes(busqueda)) &&
        (!this.filtroTipo || item.tipo_evidencia === this.filtroTipo) &&
        (
          !this.filtroEstado ||
          item.estado_evidencia === this.filtroEstado
        )
      );
    });

    this.totalItems = this.evidenciasFiltradas.length;
    this.totalPages = Math.ceil(this.totalItems / this.limit);

    this.page = Math.min(
      Math.max(this.page, 1),
      Math.max(this.totalPages, 1),
    );

    this.currentPage = this.page;

    const inicio = (this.page - 1) * this.limit;

    this.evidenciasPaginadas = this.evidenciasFiltradas.slice(
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

  formatearTamano(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) {
      return 'No disponible';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  private reiniciarFiltros(): void {
    clearTimeout(this.searchTimeout);

    this.searchBusqueda = '';
    this.filtroTipo = '';
    this.filtroEstado = '';
    this.page = 1;
    this.currentPage = 1;
  }

  private vaciarListado(): void {
    this.evidencias = [];
    this.evidenciasFiltradas = [];
    this.evidenciasPaginadas = [];

    this.imagenesConError.clear();

    this.totalItems = 0;
    this.totalPages = 0;
  }

  private obtenerUrlArchivo(valor: string | null): string | null {
    if (!valor?.trim()) {
      return null;
    }

    try {
      const url = new URL(valor.trim());

      return url.protocol === 'https:' || url.protocol === 'http:'
        ? url.href
        : null;
    } catch {
      return null;
    }
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
