import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { finalize, Observable, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Service
import { RutaHorarioService } from '../../../services/ruta-horario.service';

// Interfaces
import { RutaHorarioData } from '../../../interfaces/rutas';
import { CreateRutaHorarioData, CreateRutaHorarioRequest, CreateRutaHorarioResponse, DiasSemana, Frecuencia, UpdateRutaHorarioRequest, UpdateRutaHorarioResponse } from '../../../interfaces/ruta-horario';

// *********************************************************
// VALIDADORES
// *********************************************************
const textoNoVacio: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const valor = String(control.value ?? '');

  if (!valor) {
    return null;
  }

  return valor.trim() ? null : { textoNoVacio: true };
};

function normalizarHora(valor: string): string | null {
  // Acepta HH:mm o HH:mm:ss y devuelve HH:mm:ss.
  const coincidencia =
    /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(valor);

  if (!coincidencia) {
    return null;
  }

  return (
    `${coincidencia[1]}:${coincidencia[2]}:` +
    `${coincidencia[3] ?? '00'}`
  );
}

const horaValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }

  return normalizarHora(String(control.value))
    ? null
    : { horaInvalida: true };
};

function fechaValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const fecha = new Date(`${valor}T00:00:00Z`);

  return (
    Number.isFinite(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor
  );
}

const fechaValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }

  return fechaValida(String(control.value))
    ? null
    : { fechaInvalida: true };
};

const opcionPermitida = (
  opciones: readonly string[],
): ValidatorFn => (
  control: AbstractControl,
): ValidationErrors | null => {
    const valor = control.value;

    // El campo obligatorio lo valida Validators.required.
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    return typeof valor === 'string' && opciones.includes(valor)
      ? null
      : { opcionInvalida: true };
  };

const rangoFechasValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const controlDesde = control.get('fecha_vigencia_desde');
  const controlHasta = control.get('fecha_vigencia_hasta');

  // En edición estos campos no se modifican.
  if (controlDesde?.disabled || controlHasta?.disabled) {
    return null;
  }

  const desde = controlDesde?.value;
  const hasta = controlHasta?.value;

  if (
    !desde ||
    !hasta ||
    !fechaValida(desde) ||
    !fechaValida(hasta)
  ) {
    return null;
  }

  return hasta >= desde
    ? null
    : { rangoFechasInvalido: true };
};

@Component({
  selector: 'ruta-horario-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UppercaseDirective,
  ],
  templateUrl: './ruta-horario-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutaHorarioFormComponent
  implements OnChanges, OnDestroy {
  // ================================
  // Inputs / Outputs
  // ================================
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() ruta_id: number | null = null;

  @Input() horarioSeleccionado: RutaHorarioData | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  @Output() horarioGuardado = new EventEmitter<CreateRutaHorarioData | RutaHorarioData>();

  // ================================
  // Estado
  // ================================
  isSaving = false;
  errorFormulario: string | null = null;

  private consulta?: Subscription;


  // ============================================================
  // Selectores
  // ============================================================
  readonly diasSemana: {
    value: DiasSemana;
    label: string;
  }[] = [
      {
        value: 'LUNES',
        label: 'LUNES',
      },
      {
        value: 'MARTES',
        label: 'MARTES',
      },
      {
        value: 'MIERCOLES',
        label: 'MIERCOLES',
      },
      {
        value: 'JUEVES',
        label: 'JUEVES',
      },
      {
        value: 'VIERNES',
        label: 'VIERNES',
      },
      {
        value: 'SABADO',
        label: 'SABADO',
      },
      {
        value: 'DOMINGO',
        label: 'DOMINGO',
      },
    ];

  readonly frecuencia: {
    value: Frecuencia;
    label: string;
  }[] = [
      {
        value: 'SEMANAL',
        label: 'SEMANAL',
      },
      {
        value: 'QUINCENAL',
        label: 'QUINCENAL',
      },
      {
        value: 'MENSUAL',
        label: 'MENSUAL',
      },
      {
        value: 'ESPECIAL',
        label: 'ESPECIAL',
      },
    ];

  // ================================
  // Formulario
  // ================================
  readonly form = new FormGroup(
    {
      dia_semana: new FormControl<DiasSemana | null>(null, {
        validators: [
          Validators.required,
          opcionPermitida(
            this.diasSemana.map(opcion => opcion.value),
          ),
        ],
      }),

      hora_inicio: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, horaValidator],
      }),

      hora_fin: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, horaValidator],
      }),

      frecuencia: new FormControl<Frecuencia | null>(null, {
        validators: [
          Validators.required,
          opcionPermitida(
            this.frecuencia.map(opcion => opcion.value),
          ),
        ],
      }),

      fecha_vigencia_desde: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, fechaValidator],
      }),

      fecha_vigencia_hasta: new FormControl('', {
        nonNullable: true,
        validators: [fechaValidator],
      }),

      observacion: new FormControl('', {
        nonNullable: true,
      }),
    },
    {
      validators: rangoFechasValidator,
    },
  );

  constructor(
    private horarioService: RutaHorarioService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    const cambiaContexto =
      changes['mostrarModal'] ||
      changes['modoEdicion'] ||
      changes['ruta_id'] ||
      changes['horarioSeleccionado'];

    if (!cambiaContexto) {
      return;
    }

    this.consulta?.unsubscribe();
    this.consulta = undefined;

    if (this.mostrarModal) {
      this.prepararFormulario();
    }
  }

  ngOnDestroy(): void {
    this.consulta?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================
  guardarHorario(): void {
    if (this.isSaving) {
      return;
    }

    this.errorFormulario = null;
    this.form.markAllAsTouched();

    const idRuta = this.ruta_id;
    const horario = this.horarioSeleccionado;
    const esEdicion = this.modoEdicion;

    if (
      idRuta === null ||
      !Number.isSafeInteger(idRuta) ||
      idRuta <= 0
    ) {
      this.errorFormulario =
        'El identificador de la ruta no es válido.';
      return;
    }

    if (
      esEdicion &&
      (
        !horario ||
        !Number.isSafeInteger(horario.id_ruta_horario) ||
        horario.id_ruta_horario <= 0 ||
        horario.id_ruta !== idRuta
      )
    ) {
      this.errorFormulario =
        'Selecciona un horario que pertenezca a esta ruta.';
      return;
    }

    if (this.form.invalid) {
      return;
    }

    const valores = this.form.getRawValue();

    const horaInicio = normalizarHora(valores.hora_inicio);
    const horaFin = normalizarHora(valores.hora_fin);

    if (!horaInicio || !horaFin) {
      this.errorFormulario = 'Revisa las horas ingresadas.';
      return;
    }

    let solicitud: Observable<
      CreateRutaHorarioResponse | UpdateRutaHorarioResponse
    >;

    if (esEdicion && horario) {
      // Solo se envían los campos permitidos en actualización.
      const request: UpdateRutaHorarioRequest = {
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        observacion: valores.observacion.trim(),
      };

      solicitud = this.horarioService.updateRutaHorario(
        idRuta,
        horario.id_ruta_horario,
        request,
      );
    } else {
      if (
        valores.dia_semana === null ||
        valores.frecuencia === null
      ) {
        this.errorFormulario =
          'Selecciona el día de la semana y la frecuencia.';
        return;
      }

      const request: CreateRutaHorarioRequest = {
        dia_semana: valores.dia_semana,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        frecuencia: valores.frecuencia,
        fecha_vigencia_desde: valores.fecha_vigencia_desde,
        fecha_vigencia_hasta:
          valores.fecha_vigencia_hasta || null,
        observacion: valores.observacion.trim() || null,
      };

      solicitud = this.horarioService.createRutaHorario(
        idRuta,
        request,
      );
    }

    this.isSaving = true;
    this.form.disable({ emitEvent: false });
    this.cdr.markForCheck();

    this.consulta = solicitud
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.configurarCampos();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorFormulario =
              response.message || 'No se pudo guardar el horario.';

            this.cdr.markForCheck();
            return;
          }

          this.horarioGuardado.emit(response.data);
          this.modalCerrado.emit();

          void Swal.fire({
            icon: 'success',
            title: esEdicion
              ? 'Horario actualizado'
              : 'Horario registrado',
            text: response.message,
            timer: 1800,
            showConfirmButton: false,
          });
        },
        error: (error: unknown) => {
          void Swal.fire({
            icon: 'error',
            title: 'No se pudo guardar el horario',
            text: this.obtenerMensajeError(error),
          });
        },
      });
  }

  // ================================
  // Helpers methods
  // ================================
  campoInvalido(
    campo: keyof typeof this.form.controls,
  ): boolean {
    const control = this.form.controls[campo];

    return control.invalid && control.touched;
  }

  private prepararFormulario(): void {
    this.errorFormulario = null;
    this.form.enable({ emitEvent: false });

    this.form.reset({
      dia_semana: null,
      hora_inicio: '',
      hora_fin: '',
      frecuencia: null,
      fecha_vigencia_desde: '',
      fecha_vigencia_hasta: '',
      observacion: '',
    });

    if (this.modoEdicion && this.horarioSeleccionado) {
      const horario = this.horarioSeleccionado;

      const diaSeleccionado = this.diasSemana.find(
        opcion => opcion.value === horario.dia_semana,
      )?.value ?? null;

      const frecuenciaSeleccionada = this.frecuencia.find(
        opcion => opcion.value === horario.frecuencia,
      )?.value ?? null;

      this.form.patchValue({
        dia_semana: diaSeleccionado,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        frecuencia: frecuenciaSeleccionada,
        fecha_vigencia_desde: horario.fecha_vigencia_desde,
        fecha_vigencia_hasta: horario.fecha_vigencia_hasta ?? '',
        observacion: horario.observacion ?? '',
      });
    }

    this.configurarCampos();
    this.cdr.markForCheck();
  }

  esRequerido(campo: string): boolean {
    return (
      this.form
        .get(campo)
        ?.hasValidator(Validators.required) ?? false
    );
  }

  campoCompleto(campo: string): boolean {
    const control = this.form.get(campo);

    if (!control || !control.valid) {
      return false;
    }

    const valor = control.value;

    if (typeof valor === 'string') {
      return valor.trim().length > 0;
    }

    if (Array.isArray(valor)) {
      return valor.length > 0;
    }

    return valor !== null && valor !== undefined;
  }

  private configurarCampos(): void {
    this.form.enable({ emitEvent: false });

    if (this.modoEdicion) {
      this.form.controls.dia_semana.disable({ emitEvent: false });
      this.form.controls.frecuencia.disable({ emitEvent: false });

      this.form.controls.fecha_vigencia_desde.disable({
        emitEvent: false,
      });

      this.form.controls.fecha_vigencia_hasta.disable({
        emitEvent: false,
      });
    }

    this.form.updateValueAndValidity({ emitEvent: false });
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
      : 'Ocurrió un error al guardar el horario.';
  }

  // ================================
  // Modales methods
  // ================================
  cerrarModal(): void {
    if (this.isSaving) {
      return;
    }

    this.modalCerrado.emit();
  }
}
