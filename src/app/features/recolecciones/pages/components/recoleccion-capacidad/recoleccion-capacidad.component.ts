import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { finalize, Subscription } from 'rxjs';

// Service
import { RecoleccionesService } from '../../../services/recolecciones.service';

// Interfaces
import { CapacidadRecorridoData } from '../../../interfaces';

@Component({
  selector: 'recoleccion-capacidad',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './recoleccion-capacidad.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoleccionCapacidadComponent
  implements OnChanges, OnDestroy {
  // ================================
  // Inputs
  // ================================
  @Input() idRecorrido: number | null = null;
  @Input() actualizacion = 0;

  // ================================
  // Datos
  // ================================
  capacidadRecorrido: CapacidadRecorridoData | null = null;

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
      this.getCapacidadRecorrido();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consulta?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================
  getCapacidadRecorrido(): void {
    this.consulta?.unsubscribe();

    this.capacidadRecorrido = null;
    this.errorCarga = null;
    this.isLoading = false;

    const id = this.idRecorrido;

    // Todavía no se seleccionó un recorrido.
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
      .getCapacidadRecorrido(id)
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
              'No se pudo obtener la capacidad del vehículo.';
            return;
          }

          this.capacidadRecorrido = response.data;
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
    const porcentaje =
      this.capacidadRecorrido?.capacidad.porcentaje ?? 0;

    // Limita únicamente la barra; el porcentaje real
    // se muestra sin recortarlo.
    return Number.isFinite(porcentaje)
      ? Math.min(100, Math.max(0, porcentaje))
      : 0;
  }

  get nivelCapacidad(): 'normal' | 'advertencia' | 'critico' {
    const capacidad = this.capacidadRecorrido?.capacidad;

    if (!capacidad) {
      return 'normal';
    }

    if (
      capacidad.existe_sobrecarga ||
      capacidad.capacidad_completa
    ) {
      return 'critico';
    }

    if (
      Number.isFinite(capacidad.porcentaje) &&
      Number.isFinite(capacidad.umbral_advertencia) &&
      capacidad.porcentaje >= capacidad.umbral_advertencia
    ) {
      return 'advertencia';
    }

    return 'normal';
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
      : 'No se pudo obtener la capacidad del vehículo.';
  }
}
