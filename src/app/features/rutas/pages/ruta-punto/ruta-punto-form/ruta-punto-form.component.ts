import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { finalize, Observable, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { RutaVersionPuntoService } from '../../../services/ruta-version-punto.service';

// Interfaces
import { RutaPuntoData, RutaVersionConPuntosData } from '../../../interfaces/rutas';
import { CreateRutaPuntoData, CreateRutaPuntoRequest, CreateRutaPuntoResponse, TipoRutaPunto, UpdateRutaPuntoData, UpdateRutaPuntoRequest, UpdateRutaPuntoResponse } from '../../../interfaces/ruta-puntos';

// Componentes
import { MapaBaseComponent, PuntoOperativoMapa } from 'src/app/shared/components/mapa-base/mapa-base.component';
import { TrazadoSelectorComponent } from '../../components/trazado-selector/trazado-selector.component';

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
    TrazadoSelectorComponent,
    MapaBaseComponent,
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
  @Input() version: RutaVersionConPuntosData | null = null;
  @Input() puntosExistentes: RutaPuntoData[] = [];
  @Input() tipoSugerido: TipoRutaPunto = 'RECOLECCION';
  coordenadas: [number, number][] = [];
  indiceSeleccionado = -1;
  private cambiosTipo?: Subscription;
  private cambiosFormulario?: Subscription;
  puntosMapa: PuntoOperativoMapa[] = [];
  puntoTemporal: PuntoOperativoMapa | null = null;
  errorMapa: string | null = null;

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
        min: 1,
        max: 1000,
        step: '1',
      },
      {
        campo: 'tiempo_estimado_min',
        etiqueta: 'Tiempo estimado (min)',
        min: 1,
        max: null,
        step: '1',
      },
    ];

  // ================================
  // Formulario
  // ================================
  readonly form = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, textoNoVacio, Validators.minLength(2), Validators.maxLength(30)],
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

    radio_atencion_metros: new FormControl<number | null>(30, [
      Validators.required,
      numeroFinito,
      numeroEntero,
      Validators.min(1),
      Validators.max(1000),
    ]),

    tiempo_estimado_min: new FormControl<number | null>(null, [
      numeroFinito,
      numeroEntero,
      Validators.min(1),
    ]),

    obligatorio: new FormControl(false, {
      nonNullable: true,
    }),
  });

  constructor(
    private puntosService: RutaVersionPuntoService,
    private cdr: ChangeDetectorRef,
  ) {
    this.cambiosTipo = this.form.controls.tipo_punto.valueChanges.subscribe(() => this.aplicarTipo());
    this.cambiosFormulario = this.form.valueChanges.subscribe(() => this.actualizarMarcadoresMapa());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['puntosExistentes']) this.actualizarMarcadoresMapa();
    const cambiaContexto =
      changes['mostrarModal'] ||
      changes['modoEdicion'] ||
      changes['idRutaVersion'] ||
      changes['puntoSeleccionado'] ||
      changes['version'] ||
      changes['tipoSugerido'];

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
    this.cambiosTipo?.unsubscribe();
    this.cambiosFormulario?.unsubscribe();
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
      this.errorFormulario = 'Selecciona un punto que pertenezca a esta versión.';
      return;
    }

    if (this.form.invalid) {
      return;
    }

    const valores = this.form.getRawValue();
    const otros = this.puntosExistentes.filter(p => p.id_ruta_punto !== punto?.id_ruta_punto);
    const esExtremo = valores.tipo_punto === 'INICIO' || valores.tipo_punto === 'FINAL';

    if (esExtremo && otros.some(p => p.tipo_punto === valores.tipo_punto)) {
      this.errorFormulario = 'Esta versión ya tiene un punto de ese tipo. Edita el existente.';
      return;
    }
    if (otros.some(p => p.orden === valores.orden || p.codigo.trim().toUpperCase() === valores.codigo.trim().toUpperCase())) {
      this.errorFormulario = 'El código y el orden deben ser únicos dentro de la versión.';
      return;
    }
    const orden = valores.orden ?? 0;
    if (otros.some(p =>
      (valores.tipo_punto === 'INICIO' && p.orden <= orden) ||
      (valores.tipo_punto === 'FINAL' && p.orden >= orden) ||
      (p.tipo_punto === 'INICIO' && p.orden >= orden) ||
      (p.tipo_punto === 'FINAL' && p.orden <= orden))) {
      this.errorFormulario = 'El inicio debe tener el menor orden y el final el mayor. Coloca las recolecciones entre ambos.';
      return;
    }
    const extremo = valores.tipo_punto === 'INICIO' ? this.coordenadas[0] : this.coordenadas[this.coordenadas.length - 1];
    if (esExtremo && (!extremo || valores.longitud !== extremo[0] || valores.latitud !== extremo[1])) {
      this.errorFormulario = 'Selecciona el extremo correspondiente del trazado.';
      return;
    }

    if (
      valores.latitud === null ||
      valores.longitud === null ||
      valores.orden === null ||
      valores.radio_atencion_metros === null
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
  campoInvalido(campo: keyof typeof this.form.controls): boolean {
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
      return 'El valor debe ser un número entero.';
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
    this.errorMapa = null;
    this.form.enable({ emitEvent: false });

    const geometria = this.version?.geometria_geojson;
    this.coordenadas = geometria?.type === 'LineString'
      ? geometria.coordinates.map(c => [c[0], c[1]] as [number, number]) : [];
    this.indiceSeleccionado = -1;

    this.form.reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo_punto: this.tipoSugerido,
      latitud: null,
      longitud: null,
      orden:
        Number.isSafeInteger(this.ordenSugerido) &&
          this.ordenSugerido > 0
          ? this.ordenSugerido
          : 1,
      radio_atencion_metros: 30,
      tiempo_estimado_min: null,
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

    if (!this.modoEdicion) {
      const tipo = this.form.controls.tipo_punto.value;
      this.form.patchValue({
        codigo: `${tipo}-${this.idRutaVersion}-${this.ordenSugerido}`.slice(0, 30),
        nombre: tipo === 'INICIO' ? 'Inicio del recorrido' : tipo === 'FINAL' ? 'Final del recorrido' : 'Punto de recolección',
      }, { emitEvent: false });
    }
    this.aplicarTipo();
    this.actualizarMarcadoresMapa();
    this.cdr.markForCheck();
  }

  seleccionarEnMapa(coordenada: [number, number]): void {
    if (this.isSaving || this.esExtremo) return;

    const [longitud, latitud] = coordenada;

    if (
      !Number.isFinite(longitud) ||
      !Number.isFinite(latitud) ||
      Math.abs(longitud) > 180 ||
      Math.abs(latitud) > 90) {
      return
    };

    this.form.patchValue({ longitud, latitud }, { emitEvent: false });
    this.actualizarMarcadoresMapa();
    this.indiceSeleccionado = this.coordenadas.findIndex(c => c[0] === longitud && c[1] === latitud);
    this.cdr.markForCheck();
  }

  aplicarTipo(): void {
    const tipo = this.form.controls.tipo_punto.value;
    if (tipo === 'INICIO') this.seleccionarUbicacion(0);
    else if (tipo === 'FINAL') this.seleccionarUbicacion(this.coordenadas.length - 1);
    else {
      const { longitud, latitud } = this.form.getRawValue();
      this.indiceSeleccionado = this.coordenadas.findIndex(c => c[0] === longitud && c[1] === latitud);
    }
    this.cdr.markForCheck();
  }

  seleccionarUbicacion(indice: number): void {
    if (this.isSaving) return;
    const tipo = this.form.controls.tipo_punto.value;
    const elegido = tipo === 'INICIO' ? 0 : tipo === 'FINAL' ? this.coordenadas.length - 1 : indice;
    const coordenada = this.coordenadas[elegido];
    if (!coordenada) return;
    this.indiceSeleccionado = elegido;
    this.form.patchValue({ longitud: coordenada[0], latitud: coordenada[1] }, { emitEvent: false });
    this.actualizarMarcadoresMapa();
  }

  private actualizarMarcadoresMapa(): void {
    const idEditado = this.modoEdicion ? this.puntoSeleccionado?.id_ruta_punto : undefined;
    this.puntosMapa = this.puntosExistentes
      .filter(p => p.estado && p.id_ruta_punto !== idEditado)
      .map(p => ({
        longitud: Number(p.longitud), latitud: Number(p.latitud),
        tipo_punto: p.tipo_punto, orden: p.orden, nombre: p.nombre
      }))
      .filter(p => Number.isFinite(p.longitud) && Number.isFinite(p.latitud));
    const v = this.form.getRawValue();
    this.puntoTemporal = typeof v.longitud === 'number' && typeof v.latitud === 'number' &&
      Number.isFinite(v.longitud) && Number.isFinite(v.latitud) &&
      Math.abs(v.longitud) <= 180 && Math.abs(v.latitud) <= 90
      ? {
        longitud: v.longitud, latitud: v.latitud, tipo_punto: v.tipo_punto,
        orden: v.orden ?? undefined, nombre: v.nombre
      }
      : null;
    this.cdr.markForCheck();
  }

  get esExtremo(): boolean {
    return ['INICIO', 'FINAL'].includes(this.form.controls.tipo_punto.value);
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
