import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { MantenimientoService } from '../../services/mantenimiento.service';

// Interface
// import {
//   MantenimientoDetalleData,
// } from '../../interfaces/create-mantenimiento.interface';



// import {
//   IniciarMantenimientoRequest,
// } from '../../interfaces/iniciar-mantenimiento.interface';
import { IniciarMantenimientoRequest, MantenimientoDetalleData, MantenimientoPaginadoItem } from '../../interfaces';




// *********************************************************
// UTILIDADES Y VALIDADORES
// *********************************************************

function estaVacio(value: unknown): boolean {
  return value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '');
}

function fechaLocalPeruAISO(value: string): string | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, seconds] = match;

  const normalized =
    `${year}-${month}-${day}T${hour}:${minute}:${seconds ?? '00'}`;

  const fecha = new Date(`${normalized}-05:00`);

  if (!Number.isFinite(fecha.getTime())) {
    return null;
  }

  const local = new Date(
    fecha.getTime() - 5 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 19);

  return local === normalized
    ? `${normalized}-05:00`
    : null;
}

const kilometrajeValido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (estaVacio(control.value)) {
    return null;
  }

  const numero = Number(control.value);

  return Number.isFinite(numero) && numero >= 0
    ? null
    : { kilometrajeInvalido: true };
};

const fechaLocalOpcionalValida: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (estaVacio(control.value)) {
    return null;
  }

  return fechaLocalPeruAISO(String(control.value))
    ? null
    : { fechaInvalida: true };
};

@Component({
  selector: 'iniciar-mantenimiento',
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './iniciar-mantenimiento.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IniciarMantenimientoComponent implements OnChanges {
  // private readonly fb = inject(FormBuilder);
  // private readonly mantenimientoService = inject(MantenimientosService);
  // private readonly cdr = inject(ChangeDetectorRef);
  // private readonly destroyRef = inject(DestroyRef);

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================
  @Input() mostrarModal = false;
  @Input() mantenimientoSeleccionado: MantenimientoPaginadoItem | null = null;

  @Output() mantenimientoIniciado = new EventEmitter<MantenimientoDetalleData>();
  @Output() modalCerrado = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================
  private readonly destroyRef = inject(DestroyRef);
  readonly formInicio: FormGroup;

  isLoading = false;
  errorFormulario: string | null = null;
  modalWidthClass = 'max-w-4xl';

  setModalWidth(size: 'sm' | 'md' | 'lg' | 'xl' | 'full'): void {
    const clases = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full w-[95vw]',
    };

    this.modalWidthClass = clases[size];
  }


  constructor(
    private readonly fb: FormBuilder,
    private readonly mantenimientoService: MantenimientoService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.formInicio = this.initFormulario();
  }
  // readonly formInicio = this.fb.group({
  //   kilometraje_ingreso: this.fb.control<number | string | null>(
  //     null,
  //     [kilometrajeValido],
  //   ),
  //   fecha_fin_programada: this.fb.nonNullable.control(
  //     '',
  //     [fechaLocalOpcionalValida],
  //   ),
  // });

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['mostrarModal'] ||
      changes['mantenimientoSeleccionado']
    ) {
      if (this.isLoading) {
        return;
      }

      this.resetFormulario();

      this.errorFormulario = null;
    }
  }

  // ============================================================
  // FORMULARIO
  // ============================================================
  private initFormulario(): FormGroup {
    return this.fb.group({
      kilometraje_ingreso: [null, [kilometrajeValido]],
      fecha_fin_programada: ['', [fechaLocalOpcionalValida]],
    });
  }

  // readonly formInicio = this.fb.group({
  //   kilometraje_ingreso: this.fb.control<number | string | null>(
  //     null,
  //     [kilometrajeValido],
  //   ),
  //   fecha_fin_programada: this.fb.nonNullable.control(
  //     '',
  //     [fechaLocalOpcionalValida],
  //   ),
  // });

  private resetFormulario(): void {
    this.formInicio.reset({
      kilometraje_ingreso: null,
      fecha_fin_programada: 'PREVENTIVO',
    });
  }

  // *********************************************************
  // VALIDACIÓN PARA LA VISTA
  // *********************************************************

  get puedeIniciar(): boolean {
    return this.mantenimientoSeleccionado?.estado_mantenimiento ===
      'PROGRAMADO';
  }

  campoInvalido(
    nombre: 'kilometraje_ingreso' | 'fecha_fin_programada',
  ): boolean {
    const control = this.formInicio.controls[nombre];

    return control.invalid && (control.touched || control.dirty);
  }

  // *********************************************************
  // INICIAR INTERVENCIÓN
  // *********************************************************

  iniciar(): void {
    if (this.isLoading) {
      return;
    }

    this.errorFormulario = null;

    const mantenimiento = this.mantenimientoSeleccionado;

    if (!mantenimiento) {
      this.errorFormulario = 'Selecciona un mantenimiento.';
      return;
    }

    const id = String(mantenimiento.id_mantenimiento).trim();

    if (!/^[1-9]\d*$/.test(id)) {
      this.errorFormulario = 'El identificador del mantenimiento no es válido.';
      return;
    }

    if (!this.puedeIniciar) {
      this.errorFormulario =
        'Solo se pueden iniciar mantenimientos programados.';
      return;
    }

    if (this.formInicio.invalid) {
      this.formInicio.markAllAsTouched();
      return;
    }

    const valores = this.formInicio.getRawValue();
    const request: IniciarMantenimientoRequest = {};

    if (!estaVacio(valores.kilometraje_ingreso)) {
      request.kilometraje_ingreso = valores.kilometraje_ingreso!;
    }

    if (!estaVacio(valores.fecha_fin_programada)) {
      const fechaFinISO = fechaLocalPeruAISO(
        valores.fecha_fin_programada,
      );

      if (fechaFinISO === null) {
        this.errorFormulario = 'Ingresa una fecha de fin válida.';
        return;
      }

      if (Date.parse(fechaFinISO) <= Date.now()) {
        this.errorFormulario =
          'La nueva fecha de fin debe ser posterior al momento actual.';
        return;
      }

      request.fecha_fin_programada = fechaFinISO;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.mantenimientoService
      .iniciarMantenimiento(mantenimiento.id_mantenimiento, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorFormulario =
              response.message || 'No se pudo iniciar el mantenimiento.';
            this.cdr.markForCheck();
            return;
          }

          this.isLoading = false;

          void Swal.fire({
            icon: 'success',
            title: 'Mantenimiento iniciado',
            text: response.message,
          });

          this.mantenimientoIniciado.emit(response.data);
          this.modalCerrado.emit();
        },

        error: (error: unknown) => {
          this.errorFormulario = this.obtenerMensajeError(error);
          this.cdr.markForCheck();
        },
      });
  }

  // *********************************************************
  // CERRAR MODAL
  // *********************************************************

  cerrarModal(): void {
    if (this.isLoading) {
      return;
    }

    this.modalCerrado.emit();
  }

  // *********************************************************
  // MENSAJE DEL ERROR
  // *********************************************************

  private obtenerMensajeError(error: unknown): string {
    const respuesta = error as {
      error?: { message?: unknown };
      message?: unknown;
    } | null;

    const mensaje =
      respuesta?.error?.message ??
      respuesta?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'No se pudo iniciar el mantenimiento.';
  }
}
