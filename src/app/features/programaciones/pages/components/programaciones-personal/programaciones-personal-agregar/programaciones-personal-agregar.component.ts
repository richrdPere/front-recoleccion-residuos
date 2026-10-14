import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { ProgramacionPersonalService } from 'src/app/features/programaciones/services/programacion_personal.service';

// Interfaces
import { AddPersonalProgramacionData, AddPersonalProgramacionRequest } from 'src/app/features/programaciones/interfaces/programacion-personal';

// ============================================================
// OPCIONES RECIBIDAS DESDE EL PADRE
// ============================================================
export interface PersonalProgramacionOption {
  id_personal: number;
  nombre: string;
  codigo_empleado?: string;

  // Funciones para las que esta persona puede ser seleccionada.
  funciones: string[];
}

export interface FuncionProgramacionOption {
  value: string;
  label: string;
}

// ============================================================
// VALIDADORES
// ============================================================

const idValido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value > 0
  )
    ? null
    : { idInvalido: true };
};

@Component({
  selector: 'programaciones-personal-agregar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './programaciones-personal-agregar.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramacionesPersonalAgregarComponent implements OnChanges {

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly personalService = inject(ProgramacionPersonalService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() programacion_id: number | null = null;

  @Input() personalDisponible: PersonalProgramacionOption[] = [];

  @Input() funcionesDisponibles: FuncionProgramacionOption[] = [
    { value: 'CONDUCTOR', label: 'Conductor' },
    { value: 'RECOLECTOR', label: 'Recolector' },
    { value: 'SUPERVISOR', label: 'Supervisor' },
  ];

  @Input() cargandoPersonal = false;
  @Input() errorDisponibilidad: string | null = null;

  @Output() cancelado = new EventEmitter<void>();

  @Output() personalAgregado = new EventEmitter<AddPersonalProgramacionData>();

  @Output() guardandoChange = new EventEmitter<boolean>();

  @Output() reintentarDisponibilidad = new EventEmitter<void>();

  // ============================================================
  // FORMULARIO / ESTADO
  // ============================================================

  readonly formAgregar = this.fb.group({
    id_personal: this.fb.control<number | null>(
      null,
      [Validators.required, idValido],
    ),
    funcion: this.fb.control(
      '',
      { nonNullable: true, validators: [Validators.required] },
    ),
    es_principal: this.fb.control(false, { nonNullable: true }),
    observacion: this.fb.control('', { nonNullable: true }),
  });

  isLoading = false;

  constructor() {
    this.formAgregar.controls.funcion.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Evita conservar una persona de otra función.
        this.formAgregar.controls.id_personal.reset(
          null,
          { emitEvent: false },
        );

        this.cdr.markForCheck();
      });
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['programacion_id'] && !this.isLoading) {
      this.resetearFormulario();
    }

    if (
      (changes['personalDisponible'] || changes['funcionesDisponibles']) &&
      !this.isLoading
    ) {
      const funcion = this.formAgregar.controls.funcion.value;

      if (
        funcion &&
        !this.funcionesDisponibles.some(
          (opcion) => opcion.value === funcion,
        )
      ) {
        this.formAgregar.controls.funcion.setValue('');
      }

      const idPersonal = this.formAgregar.controls.id_personal.value;

      if (
        idPersonal !== null &&
        !this.personalFiltrado.some(
          (persona) => persona.id_personal === idPersonal,
        )
      ) {
        this.formAgregar.controls.id_personal.reset(null);
      }
    }
  }

  // ============================================================
  // OPCIONES DEL SELECTOR
  // ============================================================

  get personalFiltrado(): PersonalProgramacionOption[] {
    const funcion = this.formAgregar.controls.funcion.value;

    if (!funcion) {
      return [];
    }

    return this.personalDisponible.filter(
      (persona) =>
        persona.funciones.includes(funcion),
    );
  }

  get funcionSeleccionada(): string {
    return this.formAgregar.controls.funcion.value;
  }

  // ============================================================
  // GUARDAR ASIGNACIÓN
  // ============================================================

  agregarPersonal(): void {
    if (
      this.isLoading ||
      this.cargandoPersonal ||
      this.errorDisponibilidad
    ) {
      return;
    }

    const idProgramacion = this.programacion_id;

    if (
      idProgramacion === null ||
      !Number.isSafeInteger(idProgramacion) ||
      idProgramacion <= 0
    ) {
      this.mostrarError(
        'No se pudo identificar la programación. Abre nuevamente el formulario.',
      );

      return;
    }

    if (this.formAgregar.invalid) {
      this.formAgregar.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const form = this.formAgregar.getRawValue();

    const funcionValida = this.funcionesDisponibles.some(
      (opcion) => opcion.value === form.funcion,
    );

    const personaValida = this.personalFiltrado.some(
      (persona) => persona.id_personal === form.id_personal,
    );

    if (!funcionValida || !personaValida || form.id_personal === null) {
      void Swal.fire({
        icon: 'warning',
        title: 'Revisa el personal seleccionado',
        text: 'Selecciona una función y una persona disponible para esa función.',
      });

      return;
    }

    const payload: AddPersonalProgramacionRequest = {
      id_personal: form.id_personal,
      funcion: form.funcion,
      es_principal: form.es_principal,
      observacion: form.observacion.trim() || null,
    };

    this.isLoading = true;
    this.guardandoChange.emit(true);
    this.cdr.markForCheck();

    this.personalService
      .addPersonalProgramacion(idProgramacion, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.guardandoChange.emit(false);
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.mostrarError(
              response.message ||
              'No se pudo agregar el personal a la programación.',
            );

            return;
          }

          // Libera el bloqueo antes de notificar al padre.
          this.isLoading = false;
          this.guardandoChange.emit(false);

          void Swal.fire({
            icon: 'success',
            title: 'Personal agregado correctamente',
            text: response.message ||
              'La asignación fue registrada.',
          });

          this.personalAgregado.emit(response.data);
        },

        error: (error: unknown) => {
          this.mostrarError(this.obtenerMensajeError(error));
        },
      });
  }

  // ============================================================
  // VALIDACIONES PARA EL HTML
  // ============================================================

  campoInvalido(campo: string): boolean {
    const control = this.formAgregar.get(campo);

    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  obtenerError(campo: string): string {
    const control = this.formAgregar.get(campo);

    if (!control || !this.campoInvalido(campo)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('idInvalido')) {
      return 'Selecciona un personal válido.';
    }

    return 'Revisa el valor ingresado.';
  }

  // ============================================================
  // ERRORES / LIMPIEZA
  // ============================================================

  private mostrarError(mensaje: string): void {
    void Swal.fire({
      icon: 'error',
      title: 'No se pudo agregar el personal',
      text: mensaje,
    });
  }

  private obtenerMensajeError(error: unknown): string {
    const detalle = error as {
      message?: unknown;
      error?: {
        message?: unknown;
      };
    } | null;

    const mensaje = detalle?.error?.message ?? detalle?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'Ocurrió un error al registrar la asignación.';
  }

  private resetearFormulario(): void {
    this.formAgregar.reset(
      {
        id_personal: null,
        funcion: '',
        es_principal: false,
        observacion: '',
      },
      { emitEvent: false },
    );
  }

  cancelar(): void {
    if (this.isLoading) {
      return;
    }

    this.cancelado.emit();
  }
}
