import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { ProgramacionPersonalService } from 'src/app/features/programaciones/services/programacion_personal.service';

// Interfaces
import { ProgramacionPersonalAsignadoData, RemovePersonalProgramacionData, RemovePersonalProgramacionRequest } from 'src/app/features/programaciones/interfaces/programacion-personal';

// ============================================================
// VALIDADORES
// ============================================================

const textoNoVacio: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const valor = control.value;

  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  return typeof valor === 'string' && valor.trim().length > 0
    ? null
    : { textoVacio: true };
};

@Component({
  selector: 'programaciones-personal-retirar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './programaciones-personal-retirar.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramacionesPersonalRetirarComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly personalService = inject(ProgramacionPersonalService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() programacion_id: number | null = null;
  @Input() asignacionSeleccionada:    ProgramacionPersonalAsignadoData | null = null;

  @Output() cancelado = new EventEmitter<void>();

  @Output() personalRetirado =    new EventEmitter<RemovePersonalProgramacionData>();

  @Output() guardandoChange = new EventEmitter<boolean>();

  // ============================================================
  // FORMULARIO / ESTADO
  // ============================================================

  readonly formRetirar = this.fb.nonNullable.group({
    observacion: ['', [Validators.required, textoNoVacio]],
  });

  isLoading = false;
  private destruido = false;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destruido = true;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !this.isLoading &&
      (
        changes['programacion_id'] ||
        changes['asignacionSeleccionada']
      )
    ) {
      this.formRetirar.reset(
        { observacion: '' },
        { emitEvent: false },
      );
    }
  }

  // ============================================================
  // DATOS PARA LA VISTA
  // ============================================================

  get nombreCompleto(): string {
    const persona =
      this.asignacionSeleccionada?.personal?.usuario?.persona;

    return [
      persona?.nombres,
      persona?.apellidos,
    ]
      .map((valor) => String(valor ?? '').trim())
      .filter(Boolean)
      .join(' ') || 'Nombre no registrado';
  }

  get seleccionValida(): boolean {
    const asignacion = this.asignacionSeleccionada;

    return !!(
      asignacion &&
      this.idValido(this.programacion_id) &&
      this.idValido(asignacion.id_programacion_personal) &&
      asignacion.id_programacion === this.programacion_id
    );
  }

  obtenerEtiqueta(valor: string | null | undefined): string {
    return valor?.trim().replace(/_/g, ' ') || 'No registrado';
  }

  // ============================================================
  // RETIRAR PERSONAL
  // ============================================================

  retirarPersonal(): void {
    if (this.isLoading) {
      return;
    }

    const idProgramacion = this.programacion_id;
    const asignacion = this.asignacionSeleccionada;

    if (
      !asignacion ||
      !this.idValido(idProgramacion) ||
      !this.idValido(asignacion.id_programacion_personal) ||
      asignacion.id_programacion !== idProgramacion
    ) {
      this.mostrarError(
        'Selecciona nuevamente la asignación que deseas retirar.',
      );

      return;
    }

    const observacion =
      this.formRetirar.controls.observacion.value.trim();

    this.formRetirar.controls.observacion.setValue(
      observacion,
      { emitEvent: false },
    );

    if (this.formRetirar.invalid) {
      this.formRetirar.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const payload: RemovePersonalProgramacionRequest = {
      observacion,
    };

    this.setGuardando(true);

    this.personalService
      .removePersonalProgramacion(
        idProgramacion,
        asignacion.id_programacion_personal,
        payload,
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.setGuardando(false);
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.mostrarError(
              response.message ||
              'No se pudo retirar el personal de la programación.',
            );

            return;
          }

          // Libera al padre antes de volver al listado.
          this.setGuardando(false);

          void Swal.fire({
            icon: 'success',
            title: 'Personal retirado correctamente',
            text: response.message ||
              'La asignación fue actualizada.',
          });

          this.personalRetirado.emit(response.data);
        },

        error: (error: unknown) => {
          this.mostrarError(this.obtenerMensajeError(error));
        },
      });
  }

  // ============================================================
  // VALIDACIONES / ERRORES
  // ============================================================

  get observacionInvalida(): boolean {
    const control = this.formRetirar.controls.observacion;

    return control.invalid && (control.touched || control.dirty);
  }

  get errorObservacion(): string {
    if (!this.observacionInvalida) {
      return '';
    }

    return this.formRetirar.controls.observacion.hasError('required')
      ? 'Indica el motivo del retiro.'
      : 'La observación no puede contener únicamente espacios.';
  }

  private idValido(valor: unknown): valor is number {
    return (
      typeof valor === 'number' &&
      Number.isSafeInteger(valor) &&
      valor > 0
    );
  }

  private mostrarError(mensaje: string): void {
    void Swal.fire({
      icon: 'error',
      title: 'No se pudo retirar el personal',
      text: mensaje,
    });
  }

  private obtenerMensajeError(error: unknown): string {
    const detalle = error as {
      message?: unknown;
      error?: { message?: unknown };
    } | null;

    const mensaje = detalle?.error?.message ?? detalle?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'Ocurrió un error al retirar la asignación.';
  }

  private setGuardando(valor: boolean): void {
    if (this.isLoading !== valor) {
      this.isLoading = valor;
      this.guardandoChange.emit(valor);
    }

    if (!this.destruido) {
      this.cdr.markForCheck();
    }
  }

  cancelar(): void {
    if (!this.isLoading) {
      this.cancelado.emit();
    }
  }
}
