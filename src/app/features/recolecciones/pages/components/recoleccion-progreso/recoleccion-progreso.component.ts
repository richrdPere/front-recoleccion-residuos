import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { finalize, Subscription } from 'rxjs';

// Service
import { RecoleccionesService } from '../../../services/recolecciones.service';

// Interfaces
import { RecorridoProgresoData } from '../../../interfaces';

interface CantidadPorUnidad {
  unidad: string;
  cantidad: number;
}

@Component({
  selector: 'recoleccion-progreso',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './recoleccion-progreso.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoleccionProgresoComponent
  implements OnChanges, OnDestroy {
  // ================================
  // Inputs
  // ================================
  @Input() idRecorrido: number | null = null;
  @Input() actualizacion = 0;

  // ================================
  // Datos
  // ================================
  progreso: RecorridoProgresoData | null = null;
  cantidadesPorUnidad: CantidadPorUnidad[] = [];

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
      changes['idRecorrido'] ||
      changes['actualizacion']
    ) {
      this.getRecorridoProgreso();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consulta?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================
  getRecorridoProgreso(): void {
    this.consulta?.unsubscribe();

    this.progreso = null;
    this.cantidadesPorUnidad = [];
    this.errorCarga = null;
    this.isLoading = false;

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
      .getRecorridoProgreso(id)
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
              'No se pudo obtener el progreso del recorrido.';
            return;
          }

          this.progreso = response.data;

          this.cantidadesPorUnidad = Object.entries(
            response.data.cantidades_por_unidad ?? {},
          )
            .filter(([, cantidad]) => Number.isFinite(cantidad))
            .map(([unidad, cantidad]) => ({
              unidad,
              cantidad,
            }));
        },
        error: (error: unknown) => {
          this.errorCarga = this.obtenerMensajeError(error);
        },
      });
  }

  // ================================
  // Helpers methods
  // ================================
  get porcentajeVisual(): number {
    const porcentaje = this.progreso?.porcentaje_progreso ?? 0;

    // Limita la barra; conserva el porcentaje del backend
    // para mostrarlo como texto.
    return Number.isFinite(porcentaje)
      ? Math.min(100, Math.max(0, porcentaje))
      : 0;
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
      : 'No se pudo obtener el progreso del recorrido.';
  }
}
