import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators, FormBuilder } from '@angular/forms';
import { finalize, map, Observable, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { RutaVersionService } from '../../../services/ruta-version.service';

// Interfaces
import { CreateRutaVersionData, CreateRutaVersionRequest, UpdateRutaVersionRequest } from '../../../interfaces/ruta-versiones';
import { RutaGeometriaGeoJSON, RutaVersionConPuntosData } from '../../../interfaces/rutas';
import { ZonaPoligonoGeoJSON } from 'src/app/features/zonas/interfaces';

// Componentes
import { MapaBaseComponent } from 'src/app/shared/components/mapa-base/mapa-base.component';
import { TrazadoSelectorComponent } from '../../components/trazado-selector/trazado-selector.component';

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
      if (!Array.isArray(coordenada) || coordenada.length !== 2) {
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
  imports: [CommonModule, ReactiveFormsModule, MapaBaseComponent, TrazadoSelectorComponent],
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
  @Input() poligono_geojson: ZonaPoligonoGeoJSON | null = null;
  @Input() modoEdicion = false;
  @Input() versionSeleccionada: RutaVersionConPuntosData | null = null;

  @Output() versionActualizada = new EventEmitter<void>();
  @Output() modalCerrado = new EventEmitter<void>();
  @Output() versionCreada = new EventEmitter<CreateRutaVersionData>();

  // *********************************************************
  // DEPENDENCIAS
  // *********************************************************
  private readonly fb = inject(FormBuilder);

  private readonly rutaVersionService = inject(RutaVersionService);

  private consulta?: Subscription;

  readonly coordenadasRuta = signal<[number, number][]>([]);
  readonly errorMapa = signal<string | null>(null);

  // *********************************************************
  // ESTADO
  // *********************************************************
  modalWidthClass = 'max-w-4xl';
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
    // Procesar la zona independientemente del reinicio del formulario.
    if (
      changes['poligono_geojson'] ||
      changes['mostrarModal']
    ) {
      this.zonaVisualMapa = {
        nombre: 'Zona de la ruta',
        color: '#1976D2',
        poligono_geojson: this.poligono_geojson ?? null,
      };
    }

    const cambioFormulario =
      changes['mostrarModal'] ||
      changes['ruta_id'] ||
      changes['modoEdicion'] ||
      changes['versionSeleccionada'];

    if (!cambioFormulario) {
      return;
    }


    this.consulta?.unsubscribe();
    this.consulta = undefined;
    this.guardando.set(false);

    if (!this.mostrarModal) {
      return;
    }

    this.setModalWidth('xl');
    this.reiniciarFormulario();

    if (this.modoEdicion) {
      this.cargarDatosEdicion();
    }

    // if (!changes['mostrarModal'] && !changes['ruta_id']) {

    //   return;
    // }

    // console.log(
    //   'Polígono recibido en ruta-version-form:',
    //   this.poligono_geojson,
    // );
    // this.consulta?.unsubscribe();
    // this.consulta = undefined;
    // this.guardando.set(false);

    // if (this.mostrarModal) {
    //   this.reiniciarFormulario();
    // }

    //  this.setModalWidth('xl');
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

    const esEdicion = this.modoEdicion;
    const idRuta = this.ruta_id;
    const idVersion = this.versionSeleccionada?.id_ruta_version ?? null;

    if (idRuta === null || !Number.isSafeInteger(idRuta) || idRuta <= 0) {
      this.error.set('El identificador de la ruta no es válido.');
      return;
    }

    if (
      esEdicion &&
      (
        idVersion === null ||
        !Number.isSafeInteger(idVersion) ||
        idVersion <= 0
      )
    ) {
      this.error.set(
        'El identificador de la versión no es válido.',
      );
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

    // No dejar puntos extremos guardados fuera de los nuevos extremos.
    if (esEdicion && this.versionSeleccionada?.puntos.some(p => {
      if (p.tipo_punto !== 'INICIO' && p.tipo_punto !== 'FINAL') return false;
      const extremo = p.tipo_punto === 'INICIO' ? geometria.coordinates[0] : geometria.coordinates[geometria.coordinates.length - 1];
      return Math.abs(Number(p.longitud) - extremo[0]) > 0.0000001 || Math.abs(Number(p.latitud) - extremo[1]) > 0.0000001;
    })) {
      this.error.set('El cambio desplaza un inicio o final ya registrado. Crea una nueva versión para conservar la coherencia y el historial.');
      return;
    }

    const datos = {
      geometria_geojson: geometria,
      distancia_estimada_km: valores.distancia_estimada_km,
      duracion_estimada_min: valores.duracion_estimada_min,
      fecha_vigencia_desde: valores.fecha_vigencia_desde,
      fecha_vigencia_hasta: valores.fecha_vigencia_hasta || null,
      observacion: valores.observacion.trim() || null,
    };

    let operacion$: Observable<{
      success: boolean;
      message: string;
      versionCreada: CreateRutaVersionData | null;
    }>;

    if (esEdicion && idVersion !== null) {
      const request: UpdateRutaVersionRequest = {
        ...datos,
      };

      operacion$ = this.rutaVersionService
        .updateRutaVersion(idVersion, request)
        .pipe(
          map((response) => ({
            success:
              response.success &&
              Array.isArray(response.data) &&
              response.data.length > 0,

            message: response.message,
            versionCreada: null,
          })),
        );
    } else {
      const request: CreateRutaVersionRequest = {
        ...datos,
        vigente: valores.vigente,
      };

      operacion$ = this.rutaVersionService
        .createRutaVersion(idRuta, request)
        .pipe(
          map((response) => ({
            success: response.success && !!response.data,
            message: response.message,
            versionCreada: response.data ?? null,
          })),
        );
    }

    const tituloError = esEdicion
      ? 'No se pudo actualizar la versión'
      : 'No se pudo registrar la versión';

    const mensajeError = esEdicion
      ? 'No se pudo actualizar la versión de la ruta.'
      : 'No se pudo registrar la versión de la ruta.';

    this.guardando.set(true);
    this.form.disable({ emitEvent: false });

    this.consulta = operacion$
      .pipe(
        finalize(() => {
          this.guardando.set(false);
          this.form.enable({ emitEvent: false });

          if (this.modoEdicion) {
            this.form.controls.vigente.disable({
              emitEvent: false,
            });
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            const mensaje = response.message || mensajeError;

            this.error.set(mensaje);

            void Swal.fire({
              icon: 'error',
              title: tituloError,
              text: mensaje,
              confirmButtonText: 'Aceptar',
            });

            return;
          }

          this.error.set(null);

          // Cada evento informa al padre y cierra el formulario.
          if (esEdicion) {
            this.versionActualizada.emit();
          } else if (response.versionCreada) {
            this.versionCreada.emit(response.versionCreada);
          }

          void Swal.fire({
            icon: 'success',
            title: esEdicion
              ? 'Versión actualizada'
              : 'Versión registrada',
            text:
              response.message ||
              (
                esEdicion
                  ? 'La versión se actualizó correctamente.'
                  : 'La versión se registró correctamente.'
              ),
            confirmButtonText: 'Aceptar',
          });
        },

        error: (error: unknown) => {
          const mensaje = this.obtenerMensajeError(error);

          this.error.set(mensaje);

          void Swal.fire({
            icon: 'error',
            title: tituloError,
            text: mensaje,
            confirmButtonText: 'Aceptar',
          });
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
  // PRECARGAR VERSIÓN Y TRAYECTO
  // *********************************************************

  private cargarDatosEdicion(): void {
    const version = this.versionSeleccionada;

    if (!version) {
      this.error.set(
        'No se recibió la versión que se desea actualizar.',
      );
      return;
    }

    const geometria = leerGeometria(
      JSON.stringify(version.geometria_geojson) ?? '',
    );

    this.form.patchValue({
      geometria_geojson: geometria
        ? JSON.stringify(geometria)
        : '',

      distancia_estimada_km: this.convertirNumeroPositivo(version.distancia_estimada_km),

      duracion_estimada_min: this.convertirNumeroPositivo(version.duracion_estimada_min),

      fecha_vigencia_desde: version.fecha_vigencia_desde?.slice(0, 10) ?? '',

      fecha_vigencia_hasta: version.fecha_vigencia_hasta?.slice(0, 10) ?? '',

      observacion: version.observacion ?? '',
    }, { emitEvent: false });

    // Nueva lista: no modificar las coordenadas del objeto del padre.
    this.coordenadasRuta.set(
      geometria
        ? geometria.coordinates.map(
          ([longitud, latitud]): [number, number] => [
            longitud,
            latitud,
          ],
        )
        : [],
    );

    // La vigencia se gestiona mediante su endpoint de activación.
    this.form.controls.vigente.disable({ emitEvent: false });

    this.form.markAsPristine();
    this.form.markAsUntouched();

    if (!geometria) {
      this.error.set(
        'La versión no tiene un trayecto válido. Dibújalo antes de guardar.',
      );
    }
  }

  private convertirNumeroPositivo(value: unknown): number | null {
    if (
      !['number', 'string'].includes(typeof value) ||
      String(value).trim() === ''
    ) {
      return null;
    }

    const numero = Number(value);

    return Number.isFinite(numero) && numero > 0
      ? numero
      : null;
  }

  // *********************************************************
  // MÉTODOS PRIVADOS
  // *********************************************************
  private reiniciarFormulario(): void {
    this.coordenadasRuta.set([]);
    this.errorMapa.set(null);

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

    return this.modoEdicion
      ? 'No se pudo actualizar la versión de la ruta.'
      : 'No se pudo registrar la versión de la ruta.';
  }

  setModalWidth(
    size: 'sm' | 'md' | 'lg' | 'xl' | 'full',
  ): void {
    const clases = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full w-[95vw]',
    };

    this.modalWidthClass = clases[size];
  }


  // *********************************************************
  // Getter para evitar crear un objeto nuevo en cada
  // evaluación del template y recentrar el mapa continuamente.
  // *********************************************************
  zonaVisualMapa: {
    nombre: string;
    color: string;
    poligono_geojson: ZonaPoligonoGeoJSON | null;
  } | null = null;

  // get zonaVisualMapa() {
  //   if (
  //     !this.zonaVisualCache ||
  //     this.zonaVisualCache.poligono_geojson !== this.poligono_geojson
  //   ) {
  //     this.zonaVisualCache = {
  //       nombre: 'Zona de la ruta',
  //       color: '#1976D2',
  //       poligono_geojson: this.poligono_geojson,
  //     };
  //   }

  //   return this.zonaVisualCache;
  // }

  agregarCoordenada(coordenada: [number, number]): void {
    if (this.guardando()) {
      return;
    }

    const [longitud, latitud] = coordenada;

    if (
      !Number.isFinite(longitud) ||
      !Number.isFinite(latitud) ||
      Math.abs(longitud) > 180 ||
      Math.abs(latitud) > 90
    ) {
      return;
    }

    const coordenadas = this.coordenadasRuta();
    const ultima = coordenadas[coordenadas.length - 1];

    // Evitar repetir consecutivamente la misma ubicación.
    if (
      ultima &&
      ultima[0] === longitud &&
      ultima[1] === latitud
    ) {
      return;
    }

    this.actualizarGeometria([
      ...coordenadas,
      [longitud, latitud],
    ]);
  }

  invertirSentido(): void {
    if (!this.guardando()) this.actualizarGeometria([...this.coordenadasRuta()].reverse());
  }

  deshacerUltimoPunto(): void {
    if (this.guardando()) {
      return;
    }

    this.actualizarGeometria(
      this.coordenadasRuta().slice(0, -1),
    );
  }

  limpiarTrayecto(): void {
    if (this.guardando()) {
      return;
    }

    this.actualizarGeometria([]);
  }

  private actualizarGeometria(
    coordenadas: [number, number][],
  ): void {
    this.coordenadasRuta.set(coordenadas);

    const geometria: RutaGeometriaGeoJSON | null =
      coordenadas.length >= 2
        ? {
          type: 'LineString',
          coordinates: coordenadas,
        }
        : null;

    const control = this.form.controls.geometria_geojson;

    control.setValue(
      geometria ? JSON.stringify(geometria) : '',
    );

    control.markAsDirty();
    control.markAsTouched();
  }
}
