import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators, FormBuilder } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

// Service
import { RutaVersionService } from '../../../services/ruta-version.service';

// Interfaces
import { CreateRutaVersionData, CreateRutaVersionRequest } from '../../../interfaces/ruta-versiones';
import { RutaGeometriaGeoJSON } from '../../../interfaces/rutas';

// *********************************************************
// VALIDACIÓN DE GEOMETRÍA
// *********************************************************
function leerGeometria(
  texto: string,
): RutaGeometriaGeoJSON | null {
  try {
    const valor: unknown = JSON.parse(texto);

    if (!valor || typeof valor !== 'object') {
      return null;
    }

    const geometria = valor as {
      type?: unknown;
      coordinates?: unknown;
    };

    if (
      geometria.type !== 'LineString' ||
      !Array.isArray(geometria.coordinates) ||
      geometria.coordinates.length < 2
    ) {
      return null;
    }

    const coordenadas: [number, number][] = [];

    for (const coordenada of geometria.coordinates) {
      if (
        !Array.isArray(coordenada) ||
        coordenada.length !== 2
      ) {
        return null;
      }

      const [longitud, latitud] = coordenada;

      if (
        typeof longitud !== 'number' ||
        typeof latitud !== 'number' ||
        !Number.isFinite(longitud) ||
        !Number.isFinite(latitud) ||
        longitud < -180 ||
        longitud > 180 ||
        latitud < -90 ||
        latitud > 90
      ) {
        return null;
      }

      coordenadas.push([longitud, latitud]);
    }

    // La línea debe contener al menos dos ubicaciones distintas.
    const [primeraLongitud, primeraLatitud] = coordenadas[0];

    const tieneUbicacionesDistintas = coordenadas.some(
      ([longitud, latitud]) =>
        longitud !== primeraLongitud ||
        latitud !== primeraLatitud,
    );

    if (!tieneUbicacionesDistintas) {
      return null;
    }

    return {
      type: 'LineString',
      coordinates: coordenadas,
    };
  } catch {
    return null;
  }
}

const geometriaValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const texto = String(control.value ?? '').trim();

  if (!texto) {
    return null; // Validators.required valida el campo vacío.
  }

  return leerGeometria(texto)
    ? null
    : { geometriaInvalida: true };
};

// *********************************************************
// VALIDACIÓN DE NÚMEROS
// *********************************************************
const numeroPositivoValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const valor = control.value;

  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  return typeof valor === 'number' &&
    Number.isFinite(valor) &&
    valor > 0
    ? null
    : { numeroPositivo: true };
};

// *********************************************************
// VALIDACIÓN DE FECHAS
// *********************************************************
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
  const valor = control.value;

  if (!valor) {
    return null;
  }

  return typeof valor === 'string' && fechaValida(valor)
    ? null
    : { fechaInvalida: true };
};

const rangoFechasValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const desde = control.get('fecha_vigencia_desde')?.value;
  const hasta = control.get('fecha_vigencia_hasta')?.value;

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
  selector: 'ruta-version-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ruta-version-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutaVersionFormComponent
  implements OnChanges, OnDestroy {
  // *********************************************************
  // INPUTS / OUTPUTS
  // *********************************************************
  @Input() mostrarModal = false;
  @Input() ruta_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  @Output() versionCreada = new EventEmitter<CreateRutaVersionData>();

  // *********************************************************
  // DEPENDENCIAS
  // *********************************************************
  private readonly fb = inject(FormBuilder);

  private readonly rutaVersionService =
    inject(RutaVersionService);

  private consulta?: Subscription;

  // *********************************************************
  // ESTADO
  // *********************************************************
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly ejemploGeometria = JSON.stringify(
    {
      type: 'LineString',
      coordinates: [
        [-71.9571, -13.5235],
        [-71.9565, -13.5242],
      ],
    },
    null,
    2,
  );

  // *********************************************************
  // FORMULARIO
  // *********************************************************
  readonly form = this.fb.group(
    {
      geometria_geojson: this.fb.nonNullable.control('', [
        Validators.required,
        geometriaValidator,
      ]),

      distancia_estimada_km: this.fb.control<number | null>(
        null,
        [Validators.required, numeroPositivoValidator],
      ),

      duracion_estimada_min: this.fb.control<number | null>(
        null,
        [Validators.required, numeroPositivoValidator],
      ),

      fecha_vigencia_desde: this.fb.nonNullable.control('', [
        Validators.required,
        fechaValidator,
      ]),

      fecha_vigencia_hasta: this.fb.nonNullable.control('', [
        fechaValidator,
      ]),

      observacion: this.fb.nonNullable.control(''),

      vigente: this.fb.nonNullable.control(false),
    },
    {
      validators: rangoFechasValidator,
    },
  );

  // *********************************************************
  // CICLO DE VIDA
  // *********************************************************
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['mostrarModal'] && !changes['ruta_id']) {
      return;
    }

    this.consulta?.unsubscribe();
    this.consulta = undefined;
    this.guardando.set(false);

    if (this.mostrarModal) {
      this.reiniciarFormulario();
    }
  }

  ngOnDestroy(): void {
    this.consulta?.unsubscribe();
  }

  // *********************************************************
  // 1. GUARDAR VERSIÓN
  // *********************************************************
  guardar(): void {
    if (this.guardando()) {
      return;
    }

    this.error.set(null);
    this.form.markAllAsTouched();

    const idRuta = this.ruta_id;

    if (
      idRuta === null ||
      !Number.isSafeInteger(idRuta) ||
      idRuta <= 0
    ) {
      this.error.set('El identificador de la ruta no es válido.');
      return;
    }

    if (this.form.invalid) {
      return;
    }

    const valores = this.form.getRawValue();
    const geometria = leerGeometria(valores.geometria_geojson);

    if (
      !geometria ||
      valores.distancia_estimada_km === null ||
      valores.duracion_estimada_min === null
    ) {
      return;
    }

    const request: CreateRutaVersionRequest = {
      geometria_geojson: geometria,
      distancia_estimada_km: valores.distancia_estimada_km,
      duracion_estimada_min: valores.duracion_estimada_min,
      fecha_vigencia_desde: valores.fecha_vigencia_desde,
      fecha_vigencia_hasta:
        valores.fecha_vigencia_hasta || null,
      observacion: valores.observacion.trim() || null,
      vigente: valores.vigente,
    };

    this.guardando.set(true);
    this.form.disable({ emitEvent: false });

    this.consulta = this.rutaVersionService
      .createRutaVersion(idRuta, request)
      .pipe(
        finalize(() => {
          this.guardando.set(false);
          this.form.enable({ emitEvent: false });
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.error.set(
              response.message ||
              'No se pudo registrar la versión de la ruta.',
            );
            return;
          }

          this.versionCreada.emit(response.data);
          this.modalCerrado.emit();
        },
        error: (error: unknown) => {
          this.error.set(this.obtenerMensajeError(error));
        },
      });
  }

  // *********************************************************
  // 2. CERRAR MODAL
  // *********************************************************
  cerrarModal(): void {
    if (this.guardando()) {
      return;
    }

    this.modalCerrado.emit();
  }

  // *********************************************************
  // 3. MENSAJES DE VALIDACIÓN
  // *********************************************************
  campoInvalido(
    campo: keyof typeof this.form.controls,
  ): boolean {
    const control = this.form.controls[campo];

    return control.invalid && control.touched;
  }

  // *********************************************************
  // MÉTODOS PRIVADOS
  // *********************************************************
  private reiniciarFormulario(): void {
    this.error.set(null);
    this.form.enable({ emitEvent: false });

    this.form.reset({
      geometria_geojson: '',
      distancia_estimada_km: null,
      duracion_estimada_min: null,
      fecha_vigencia_desde: '',
      fecha_vigencia_hasta: '',
      observacion: '',
      vigente: false,
    });
  }

  private obtenerMensajeError(error: unknown): string {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    if (error && typeof error === 'object') {
      const objeto = error as {
        message?: unknown;
        error?: { message?: unknown } | string;
      };

      const mensajeBackend =
        typeof objeto.error === 'string'
          ? objeto.error
          : objeto.error?.message;

      if (
        typeof mensajeBackend === 'string' &&
        mensajeBackend.trim()
      ) {
        return mensajeBackend;
      }

      if (
        typeof objeto.message === 'string' &&
        objeto.message.trim()
      ) {
        return objeto.message;
      }
    }

    return 'No se pudo registrar la versión de la ruta.';
  }
}
