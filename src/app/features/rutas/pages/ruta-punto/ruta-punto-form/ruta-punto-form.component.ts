import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { finalize, Observable, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { RutaVersionPuntoService } from '../../../services/ruta-version-punto.service';

// Interfaces
import { RutaPuntoData } from '../../../interfaces/rutas';
import { CreateRutaPuntoData, CreateRutaPuntoRequest, CreateRutaPuntoResponse, TipoRutaPunto, UpdateRutaPuntoData, UpdateRutaPuntoRequest, UpdateRutaPuntoResponse } from '../../../interfaces/ruta-puntos';

// *********************************************************
// VALIDADORES
// *********************************************************
const textoNoVacio: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const valor = control.value;

  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  return typeof valor === 'string' && valor.trim()
    ? null
    : { textoNoVacio: true };
};

const numeroFinito: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const valor = control.value;

  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  return typeof valor === 'number' && Number.isFinite(valor)
    ? null
    : { numeroFinito: true };
};

const numeroEntero: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const valor = control.value;

  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  return Number.isInteger(valor)
    ? null
    : { numeroEntero: true };
};

const TIPOS_PUNTO: TipoRutaPunto[] = [
  'INICIO',
  'RECOLECCION',
  'DESCARGA',
  'FINAL',
  'REFERENCIA',
];

const tipoPuntoPermitido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  return TIPOS_PUNTO.includes(control.value)
    ? null
    : { tipoNoPermitido: true };
};

type CampoNumerico =
  | 'latitud'
  | 'longitud'
  | 'orden'
  | 'radio_atencion_metros'
  | 'tiempo_estimado_min';

@Component({
  selector: 'ruta-punto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './ruta-punto-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutaPuntoFormComponent
  implements OnChanges, OnDestroy {
  // ================================
  // Inputs / Outputs
  // ================================
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;

  @Input() idRutaVersion: number | null = null;
  @Input() puntoSeleccionado: RutaPuntoData | null = null;

  // El padre puede sugerir el orden del nuevo punto.
  @Input() ordenSugerido = 1;

  @Output() modalCerrado = new EventEmitter<void>();

  @Output() puntoGuardado = new EventEmitter<
    CreateRutaPuntoData | UpdateRutaPuntoData
  >();

  // ================================
  // Estado
  // ================================
  isSaving = false;
  errorFormulario: string | null = null;

  readonly tiposPunto = TIPOS_PUNTO;

  private consulta?: Subscription;

  // Configuración para renderizar los campos numéricos.
  readonly camposNumericos: {
    campo: CampoNumerico;
    etiqueta: string;
    min: number;
    max: number | null;
    step: string;
  }[] = [
      {
        campo: 'latitud',
        etiqueta: 'Latitud',
        min: -90,
        max: 90,
        step: 'any',
      },
      {
        campo: 'longitud',
        etiqueta: 'Longitud',
        min: -180,
        max: 180,
        step: 'any',
      },
      {
        campo: 'orden',
        etiqueta: 'Orden',
        min: 1,
        max: null,
        step: '1',
      },
      {
        campo: 'radio_atencion_metros',
        etiqueta: 'Radio de atención (m)',
        min: 0,
        max: null,
        step: 'any',
      },
      {
        campo: 'tiempo_estimado_min',
        etiqueta: 'Tiempo estimado (min)',
        min: 0,
        max: null,
        step: 'any',
      },
    ];

  // ================================
  // Formulario
  // ================================
  readonly form = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, textoNoVacio],
    }),

    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, textoNoVacio],
    }),

    descripcion: new FormControl('', {
      nonNullable: true,
    }),

    tipo_punto: new FormControl<TipoRutaPunto>('RECOLECCION', {
      nonNullable: true,
      validators: [
        Validators.required,
        tipoPuntoPermitido,
      ],
    }),

    latitud: new FormControl<number | null>(null, [
      Validators.required,
      numeroFinito,
      Validators.min(-90),
      Validators.max(90),
    ]),

    longitud: new FormControl<number | null>(null, [
      Validators.required,
      numeroFinito,
      Validators.min(-180),
      Validators.max(180),
    ]),

    orden: new FormControl<number | null>(1, [
      Validators.required,
      numeroFinito,
      numeroEntero,
      Validators.min(1),
    ]),

    radio_atencion_metros: new FormControl<number | null>(0, [
      Validators.required,
      numeroFinito,
      Validators.min(0),
    ]),

    tiempo_estimado_min: new FormControl<number | null>(0, [
      Validators.required,
      numeroFinito,
      Validators.min(0),
    ]),

    obligatorio: new FormControl(false, {
      nonNullable: true,
    }),
  });

  constructor(
    private puntosService: RutaVersionPuntoService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    const cambiaContexto =
      changes['mostrarModal'] ||
      changes['modoEdicion'] ||
      changes['idRutaVersion'] ||
      changes['puntoSeleccionado'];

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
  guardarPunto(): void {
    if (this.isSaving) {
      return;
    }

    this.errorFormulario = null;
    this.form.markAllAsTouched();

    const idVersion = this.idRutaVersion;
    const punto = this.puntoSeleccionado;
    const esEdicion = this.modoEdicion;

    if (
      idVersion === null ||
      !Number.isSafeInteger(idVersion) ||
      idVersion <= 0
    ) {
      this.errorFormulario = 'El ID de la versión no es válido.';
      return;
    }

    if (
      esEdicion &&
      (
        !punto ||
        !Number.isSafeInteger(punto.id_ruta_punto) ||
        punto.id_ruta_punto <= 0 ||
        punto.id_ruta_version !== idVersion
      )
    ) {
      this.errorFormulario =
        'Selecciona un punto que pertenezca a esta versión.';
      return;
    }

    if (this.form.invalid) {
      return;
    }

    const valores = this.form.getRawValue();

    if (
      valores.latitud === null ||
      valores.longitud === null ||
      valores.orden === null ||
      valores.radio_atencion_metros === null ||
      valores.tiempo_estimado_min === null
    ) {
      return;
    }

    const request: CreateRutaPuntoRequest = {
      codigo: valores.codigo.trim(),
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim(),
      tipo_punto: valores.tipo_punto,
      latitud: valores.latitud,
      longitud: valores.longitud,
      orden: valores.orden,
      radio_atencion_metros: valores.radio_atencion_metros,
      tiempo_estimado_min: valores.tiempo_estimado_min,
      obligatorio: valores.obligatorio,
    };

    let solicitud: Observable<
      CreateRutaPuntoResponse | UpdateRutaPuntoResponse
    >;

    if (esEdicion && punto) {
      const updateRequest: UpdateRutaPuntoRequest = {
        ...request,
      };

      solicitud = this.puntosService.updateRutaPunto(
        idVersion,
        punto.id_ruta_punto,
        updateRequest,
      );
    } else {
      solicitud = this.puntosService.createRutaPunto(
        idVersion,
        request,
      );
    }

    this.isSaving = true;
    this.form.disable({ emitEvent: false });

    this.consulta = solicitud
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.form.enable({ emitEvent: false });
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorFormulario =
              response.message || 'No se pudo guardar el punto.';

            this.cdr.markForCheck();
            return;
          }

          this.puntoGuardado.emit(response.data);
          this.modalCerrado.emit();

          void Swal.fire({
            icon: 'success',
            title: esEdicion
              ? 'Punto actualizado'
              : 'Punto registrado',
            text: response.message,
            timer: 1800,
            showConfirmButton: false,
          });
        },
        error: (error: unknown) => {
          void Swal.fire({
            icon: 'error',
            title: 'No se pudo guardar el punto',
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

  mensajeNumerico(campo: CampoNumerico): string {
    const control = this.form.controls[campo];

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('numeroFinito')) {
      return 'Ingresa un número válido.';
    }

    if (control.hasError('numeroEntero')) {
      return 'El orden debe ser un número entero.';
    }

    if (control.hasError('min')) {
      return `El valor mínimo es ${control.getError('min').min}.`;
    }

    if (control.hasError('max')) {
      return `El valor máximo es ${control.getError('max').max}.`;
    }

    return 'Revisa el valor ingresado.';
  }

  private prepararFormulario(): void {
    this.errorFormulario = null;
    this.form.enable({ emitEvent: false });

    this.form.reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo_punto: 'RECOLECCION',
      latitud: null,
      longitud: null,
      orden:
        Number.isSafeInteger(this.ordenSugerido) &&
          this.ordenSugerido > 0
          ? this.ordenSugerido
          : 1,
      radio_atencion_metros: 0,
      tiempo_estimado_min: 0,
      obligatorio: false,
    });

    if (this.modoEdicion && this.puntoSeleccionado) {
      const punto = this.puntoSeleccionado;

      this.form.patchValue({
        codigo: punto.codigo,
        nombre: punto.nombre,
        descripcion: punto.descripcion ?? '',
        tipo_punto: punto.tipo_punto,
        latitud: this.convertirNumero(punto.latitud),
        longitud: this.convertirNumero(punto.longitud),
        orden: punto.orden,
        radio_atencion_metros: punto.radio_atencion_metros,
        tiempo_estimado_min: punto.tiempo_estimado_min,
        obligatorio: punto.obligatorio,
      });
    }

    this.cdr.markForCheck();
  }

  private convertirNumero(valor: unknown): number | null {
    if (
      valor === null ||
      valor === undefined ||
      (typeof valor === 'string' && !valor.trim())
    ) {
      return null;
    }

    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : null;
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
      : 'Ocurrió un error al guardar el punto.';
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
