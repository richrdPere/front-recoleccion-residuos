import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { finalize, Subscription } from 'rxjs';

// Service
import { ProgramacionesService } from 'src/app/features/programaciones/services/programaciones.service';

// Interface
import { ProgramacionDetalleData } from '../../../interfaces/programaciones/get-programacion-by-id.interface';

@Component({
  selector: 'programaciones-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './programaciones-view.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramacionesViewComponent implements OnChanges, OnDestroy {

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() mostrarModal = false;
  @Input() programacion_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================

  programacion: ProgramacionDetalleData | null = null;

  loading = false;
  errorCarga: string | null = null;

  modalWidthClass = 'max-w-6xl';

  private cargaSubscription?: Subscription;
  private destruido = false;

  constructor(
    private readonly programacionesService: ProgramacionesService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      this.cancelarCarga();
      this.limpiarDatos();
      return;
    }

    if (changes['mostrarModal'] || changes['programacion_id']) {
      this.cargarDatosProgramacion();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarCarga();
  }

  // ============================================================
  // CARGAR INFORMACIÓN
  // ============================================================

  cargarDatosProgramacion(): void {
    this.cancelarCarga();
    this.limpiarDatos();

    if (!this.mostrarModal) {
      return;
    }

    const idProgramacion = this.programacion_id;

    if (
      idProgramacion === null ||
      !Number.isInteger(idProgramacion) ||
      idProgramacion <= 0
    ) {
      this.errorCarga = 'Selecciona una programación válida.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.cargaSubscription = this.programacionesService
      .getProgramacionById(idProgramacion)
      .pipe(
        finalize(() => {
          this.loading = false;

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
              'No se pudo obtener la programación.';
          } else {
            this.programacion = response.data;
          }

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {
          this.programacion = null;
          this.errorCarga = this.obtenerMensajeError(error);
          this.cdr.markForCheck();
        },
      });
  }

  // ============================================================
  // HELPERS DE PRESENTACIÓN
  // ============================================================

  obtenerEstado(
    estado: string,
  ): { label: string; class: string } {
    const estados: Record<
      string,
      { label: string; class: string }
    > = {
      PROGRAMADA: {
        label: 'Programada',
        class: 'badge-info',
      },
      ASIGNADA: {
        label: 'Asignada',
        class: 'badge-primary',
      },
      ACEPTADA: {
        label: 'Aceptada',
        class: 'badge-success',
      },
      EN_CURSO: {
        label: 'En curso',
        class: 'badge-accent',
      },
      PAUSADA: {
        label: 'Pausada',
        class: 'badge-warning',
      },
      FINALIZADA: {
        label: 'Finalizada',
        class: 'badge-neutral',
      },
      CANCELADA: {
        label: 'Cancelada',
        class: 'badge-error',
      },
    };

    return estados[estado] ?? {
      label: estado,
      class: 'badge-neutral',
    };
  }

  obtenerTurno(turno: string): string {
    const turnos: Record<string, string> = {
      MANANA: 'Mañana',
      TARDE: 'Tarde',
      NOCHE: 'Noche',
      ROTATIVO: 'Rotativo',
    };

    return turnos[turno] ?? turno;
  }

  obtenerFuncion(funcion: string): string {
    const funciones: Record<string, string> = {
      CONDUCTOR: 'Conductor',
      RECOLECTOR: 'Recolector',
      SUPERVISOR: 'Supervisor',
    };

    return funciones[funcion] ?? funcion;
  }

  obtenerHora(hora: string | null | undefined): string {
    return hora ? hora.slice(0, 5) : 'No registrada';
  }

  obtenerNombre(
    nombres: string | null | undefined,
    apellidos: string | null | undefined,
  ): string {
    return [nombres, apellidos]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Nombre no registrado';
  }

  // ============================================================
  // ERRORES
  // ============================================================

  private obtenerMensajeError(error: unknown): string {
    const detalle = error as {
      message?: unknown;
      error?: { message?: unknown };
    } | null;

    const mensaje =
      detalle?.error?.message ??
      detalle?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'Ocurrió un error al cargar la programación.';
  }

  // ============================================================
  // MODAL / LIMPIEZA
  // ============================================================

  cerrarModal(): void {
    this.cancelarCarga();
    this.limpiarDatos();

    // El padre controla mostrarModal.
    this.modalCerrado.emit();
    this.cdr.markForCheck();
  }

  private cancelarCarga(): void {
    this.cargaSubscription?.unsubscribe();
    this.cargaSubscription = undefined;
    this.loading = false;
  }

  private limpiarDatos(): void {
    this.programacion = null;
    this.errorCarga = null;
  }
}
