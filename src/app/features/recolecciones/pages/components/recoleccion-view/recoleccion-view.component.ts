import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { finalize, Subscription } from 'rxjs';

// Service
import { RecoleccionesService } from '../../../services/recolecciones.service';

// Interfaces
import { RecoleccionDetalleData, RecoleccionEvidenciaData } from '../../../interfaces';

interface EvidenciaDetalle extends RecoleccionEvidenciaData {
  urlVisualizacion: string | null;
}

@Component({
  selector: 'recoleccion-view',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
  ],
  templateUrl: './recoleccion-view.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoleccionViewComponent
  implements OnChanges, OnDestroy {
  // ================================
  // Inputs / Outputs
  // ================================
  @Input() mostrarModal = false;
  @Input() idRecoleccion: number | null = null;
  @Input() actualizacion = 0;

  @Output() modalCerrado = new EventEmitter<void>();

  @Output() verEvidencias = new EventEmitter<number>();

  // ================================
  // Datos
  // ================================
  recoleccion: RecoleccionDetalleData | null = null;
  evidencias: EvidenciaDetalle[] = [];

  isLoading = false;
  errorCarga: string | null = null;

  private consulta?: Subscription;
  private destruido = false;

  constructor(
    private recoleccionesService: RecoleccionesService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !changes['mostrarModal'] &&
      !changes['idRecoleccion'] &&
      !changes['actualizacion']
    ) {
      return;
    }

    this.consulta?.unsubscribe();

    if (!this.mostrarModal) {
      this.limpiarDatos();
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.getRecoleccionById();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consulta?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================
  getRecoleccionById(): void {
    this.consulta?.unsubscribe();
    this.limpiarDatos();
    this.isLoading = false;

    const id = this.idRecoleccion;

    if (
      id === null ||
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      this.errorCarga =
        'El identificador de la recolección no es válido.';
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.consulta = this.recoleccionesService
      .getRecoleccionById(id)
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
            this.errorCarga =
              response.message ||
              'No se pudo obtener el detalle de la recolección.';
            return;
          }

          this.recoleccion = response.data;

          this.evidencias = (response.data.evidencias ?? [])
            .map((evidencia) => ({
              ...evidencia,
              urlVisualizacion: this.obtenerUrlArchivo(
                evidencia.url_archivo,
              ),
            }));
        },
        error: (error: unknown) => {
          this.errorCarga = this.obtenerMensajeError(error);
        },
      });
  }

  abrirEvidencias(): void {
    if (!this.recoleccion || this.isLoading) {
      return;
    }

    this.verEvidencias.emit(
      this.recoleccion.id_recoleccion,
    );
  }

  // ================================
  // Helpers methods
  // ================================
  private limpiarDatos(): void {
    this.recoleccion = null;
    this.evidencias = [];
    this.errorCarga = null;
  }

  private obtenerUrlArchivo(valor: string | null): string | null {
    if (!valor?.trim()) {
      return null;
    }

    try {
      const url = new URL(valor.trim());

      return url.protocol === 'http:' || url.protocol === 'https:'
        ? url.href
        : null;
    } catch {
      return null;
    }
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
      : 'No se pudo obtener el detalle de la recolección.';
  }

  // ================================
  // Modales methods
  // ================================
  cerrarModal(): void {
    this.consulta?.unsubscribe();

    this.limpiarDatos();
    this.isLoading = false;

    this.modalCerrado.emit();
  }
}
