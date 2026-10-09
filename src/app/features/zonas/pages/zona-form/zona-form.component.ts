import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Services
import { ZonasServices } from '../../services/zonas.service';

// Interfaces
import { CreateZonaRequest, UpdateZonaRequest, ZonaData, ZonaPoligonoGeoJSON } from '../../interfaces';

// Componentes
import { MapaBaseComponent } from 'src/app/shared/components/mapa-base/mapa-base.component';

// ============================================================
// VALIDADORES
// ============================================================
const textoNoVacio: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (control.value === null || control.value === '') {
    return null; // Validators.required controla este caso.
  }

  return typeof control.value === 'string' &&
    control.value.trim().length > 0
    ? null
    : { textoVacio: true };
};

const colorHexadecimal: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (control.value === null || control.value === '') {
    return null;
  }

  return /^#[0-9a-f]{6}$/i.test(String(control.value))
    ? null
    : { colorInvalido: true };
};

const coordenadaValida = (
  minimo: number,
  maximo: number,
): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;

    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    if (
      (typeof valor !== 'number' && typeof valor !== 'string') ||
      String(valor).trim() === ''
    ) {
      return { coordenadaInvalida: true };
    }

    const numero = Number(valor);

    return Number.isFinite(numero) &&
      numero >= minimo &&
      numero <= maximo
      ? null
      : { coordenadaInvalida: true };
  };
};

// Validación estructural: coordenadas, cierre y área no nula.
// La validación topológica completa corresponde también al backend.
function esPoligonoValido(
  valor: unknown,
): valor is ZonaPoligonoGeoJSON {
  if (!valor || typeof valor !== 'object') return false;

  const geometria = valor as {
    type?: unknown;
    coordinates?: unknown;
  };

  if (
    geometria.type !== 'Polygon' ||
    !Array.isArray(geometria.coordinates) ||
    geometria.coordinates.length === 0
  ) {
    return false;
  }

  return geometria.coordinates.every((anillo: unknown) => {
    if (!Array.isArray(anillo) || anillo.length < 4) return false;

    const coordenadasValidas = anillo.every(
      (punto: unknown) =>
        Array.isArray(punto) &&
        punto.length === 2 &&
        typeof punto[0] === 'number' &&
        typeof punto[1] === 'number' &&
        Number.isFinite(punto[0]) &&
        Number.isFinite(punto[1]) &&
        Math.abs(punto[0]) <= 180 &&
        Math.abs(punto[1]) <= 90,
    );

    if (!coordenadasValidas) return false;

    const puntos = anillo as [number, number][];
    const primero = puntos[0];
    const ultimo = puntos[puntos.length - 1];

    if (
      primero[0] !== ultimo[0] ||
      primero[1] !== ultimo[1]
    ) {
      return false;
    }

    const vertices = new Set(
      puntos.slice(0, -1).map(([lng, lat]) => `${lng},${lat}`),
    );

    if (vertices.size < 3) return false;

    // Calcula respecto del primer vértice para reducir
    // la pérdida de precisión con coordenadas geográficas.
    let areaDoble = 0;

    for (let i = 0; i < puntos.length - 1; i++) {
      const x1 = puntos[i][0] - primero[0];
      const y1 = puntos[i][1] - primero[1];
      const x2 = puntos[i + 1][0] - primero[0];
      const y2 = puntos[i + 1][1] - primero[1];

      areaDoble += x1 * y2 - x2 * y1;
    }

    return Math.abs(areaDoble) > 0;
  });
}

const poligonoValido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (control.value === null || control.value === '') {
    return null;
  }

  return esPoligonoValido(control.value)
    ? null
    : { poligonoInvalido: true };
};

// ============================================================
// COMPONENTE
// ============================================================
@Component({
  selector: 'zona-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    UppercaseDirective,
    MapaBaseComponent
  ],
  templateUrl: './zona-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZonaFormComponent implements OnChanges {
  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() zonaSeleccionada: ZonaData | null = null;

  // Se conserva el nombre para no cambiar el contrato del padre.
  // Se emite después de crear o actualizar.
  @Output() zonaCreada = new EventEmitter<void>();
  @Output() modalCerrado = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================

  private readonly destroyRef = inject(DestroyRef);

  readonly formZona: FormGroup;

  isLoading = false;
  modalWidthClass = 'max-w-4xl';

  constructor(
    private readonly fb: FormBuilder,
    private readonly zonaService: ZonasServices,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.formZona = this.initFormulario();
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================

  ngOnChanges(changes: SimpleChanges): void {
    // Evita reemplazar el formulario mientras se está guardando.
    if (this.isLoading) return;

    if (!this.mostrarModal) {
      if (changes['mostrarModal']) {
        this.resetearFormulario();
      }

      return;
    }

    const debeSincronizar =
      !!changes['mostrarModal'] ||
      !!changes['modoEdicion'] ||
      !!changes['zonaSeleccionada'];

    if (!debeSincronizar) return;

    this.setModalWidth('lg');

    if (this.modoEdicion && this.zonaSeleccionada) {
      this.cargarZona(this.zonaSeleccionada);
    } else {
      this.resetearFormulario();
    }
  }

  // ============================================================
  // FORMULARIO
  // ============================================================
  private initFormulario(): FormGroup {
    return this.fb.group({
      codigo: ['', [Validators.required, textoNoVacio]],
      nombre: ['', [Validators.required, textoNoVacio]],
      descripcion: [''],
      color: ['#2563EB', [Validators.required, colorHexadecimal]],
      poligono_geojson: new FormControl<ZonaPoligonoGeoJSON | null>(null, [Validators.required, poligonoValido]),
      centro_latitud: new FormControl<number | null>(
        null,
        [
          Validators.required,
          coordenadaValida(-90, 90),
        ],
      ),
      centro_longitud: new FormControl<number | null>(
        null,
        [
          Validators.required,
          coordenadaValida(-180, 180),
        ],
      ),
    });
  }

  private resetearFormulario(): void {
    this.formZona.reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      color: '#2563EB',
      poligono_geojson: null,
      centro_latitud: null,
      centro_longitud: null,
    });
  }

  private cargarZona(zona: ZonaData): void {
    this.formZona.reset({
      codigo: zona.codigo,
      nombre: zona.nombre,
      descripcion: zona.descripcion ?? '',
      color: zona.color ?? '#2563EB',

      // Copia profunda para no modificar el objeto del listado.
      poligono_geojson: zona.poligono_geojson
        ? this.copiarPoligono(zona.poligono_geojson)
        : null,

      centro_latitud: this.numeroONull(zona.centro_latitud),
      centro_longitud: this.numeroONull(zona.centro_longitud),
    });
  }

  // ============================================================
  // RECIBIR DATOS DEL EDITOR DEL MAPA
  // ============================================================
  recibirPoligono(poligono: ZonaPoligonoGeoJSON | null): void {
    if (this.isLoading) return;

    const control = this.formZona.get('poligono_geojson');

    control?.setValue(
      poligono ? this.copiarPoligono(poligono) : null,
    );

    control?.markAsDirty();
    control?.markAsTouched();

    // Al cambiar el trazado, el centro anterior debe revisarse.
    this.formZona.patchValue({
      centro_latitud: null,
      centro_longitud: null,
    });

    this.cdr.markForCheck();
  }

  recibirCentro(
    centro: { latitud: number; longitud: number },
  ): void {
    if (this.isLoading) return;

    this.formZona.patchValue({
      centro_latitud: centro.latitud,
      centro_longitud: centro.longitud,
    });

    this.formZona.get('centro_latitud')?.markAsDirty();
    this.formZona.get('centro_longitud')?.markAsDirty();

    this.cdr.markForCheck();
  }

  // ============================================================
  // CREAR / ACTUALIZAR
  // ============================================================

  crearOEditarZona(): void {
    if (this.isLoading) return;

    this.normalizarCamposTexto();

    if (this.formZona.invalid) {
      this.formZona.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const esEdicion = this.modoEdicion;
    const idZona = this.zonaSeleccionada?.id_zona;

    if (
      esEdicion &&
      (
        typeof idZona !== 'number' ||
        !Number.isSafeInteger(idZona) ||
        idZona <= 0
      )
    ) {
      void Swal.fire({
        icon: 'error',
        title: 'No se pudo identificar la zona',
        text: 'Selecciona nuevamente la zona que deseas editar.',
      });

      return;
    }

    const form = this.formZona.getRawValue();

    // Validación adicional para construir un request seguro.
    if (!esPoligonoValido(form.poligono_geojson)) {
      this.formZona.get('poligono_geojson')?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const payloadCrear: CreateZonaRequest = {
      codigo: form.codigo,
      nombre: form.nombre,
      descripcion: form.descripcion,
      color: form.color,
      poligono_geojson: this.copiarPoligono(
        form.poligono_geojson,
      ),
      centro_latitud: Number(form.centro_latitud),
      centro_longitud: Number(form.centro_longitud),
    };

    // Update permite campos opcionales; este formulario
    // envía todos los campos editables de la zona.
    const payloadActualizar: UpdateZonaRequest = {
      ...payloadCrear,
    };

    // Contrato común para ambas respuestas.
    const solicitud$: Observable<{
      success: boolean;
      message: string;
    }> = esEdicion
        ? this.zonaService.updateZona(idZona!, payloadActualizar)
        : this.zonaService.createZona(payloadCrear);

    this.isLoading = true;
    this.cdr.markForCheck();

    solicitud$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            void Swal.fire({
              icon: 'error',
              title: esEdicion
                ? 'No se pudo actualizar la zona'
                : 'No se pudo registrar la zona',
              text:
                response.message ||
                'La operación no fue completada.',
            });

            return;
          }

          // Habilita el cierre antes de emitir los eventos.
          this.isLoading = false;
          this.cerrarModal();
          this.zonaCreada.emit();

          void Swal.fire({
            icon: 'success',
            title: esEdicion
              ? 'Zona actualizada correctamente'
              : 'Zona registrada correctamente',
            text: response.message,
          });
        },

        error: (error: unknown) => {
          void Swal.fire({
            icon: 'error',
            title: esEdicion
              ? 'Error al actualizar zona'
              : 'Error al registrar zona',
            text: this.obtenerMensajeError(error),
          });
        },
      });
  }

  // ============================================================
  // VALIDACIONES PARA EL HTML
  // ============================================================

  campoInvalido(campo: string): boolean {
    const control = this.formZona.get(campo);

    return !!control &&
      control.invalid &&
      (control.touched || control.dirty);
  }

  obtenerError(campo: string): string {
    const control = this.formZona.get(campo);

    if (!control || !this.campoInvalido(campo)) return '';

    if (control.hasError('required')) {
      return campo === 'poligono_geojson'
        ? 'Dibuja el polígono de la zona.'
        : 'Este campo es obligatorio.';
    }

    if (control.hasError('textoVacio')) {
      return 'Ingresa un texto que no contenga solamente espacios.';
    }

    if (control.hasError('colorInvalido')) {
      return 'Ingresa un color hexadecimal de seis dígitos, como #2563EB.';
    }

    if (control.hasError('coordenadaInvalida')) {
      return campo === 'centro_latitud'
        ? 'La latitud debe ser un número entre -90 y 90.'
        : 'La longitud debe ser un número entre -180 y 180.';
    }

    if (control.hasError('poligonoInvalido')) {
      return 'El polígono debe tener coordenadas válidas, al menos tres vértices distintos y estar cerrado.';
    }

    return 'Revisa el valor ingresado.';
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  private normalizarCamposTexto(): void {
    const form = this.formZona.getRawValue();

    this.formZona.patchValue(
      {
        codigo: String(form.codigo ?? '').trim().toUpperCase(),
        nombre: String(form.nombre ?? '').trim(),
        descripcion: String(form.descripcion ?? '').trim(),
        color: String(form.color ?? '').trim().toUpperCase(),
      },
      { emitEvent: false },
    );
  }

  private numeroONull(valor: unknown): number | null {
    if (
      valor === null ||
      valor === undefined ||
      String(valor).trim() === ''
    ) {
      return null;
    }

    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : null;
  }

  private copiarPoligono(
    poligono: ZonaPoligonoGeoJSON,
  ): ZonaPoligonoGeoJSON {
    return {
      type: 'Polygon',
      coordinates: poligono.coordinates.map(
        (anillo) =>
          anillo.map(
            ([longitud, latitud]): [number, number] =>
              [longitud, latitud],
          ),
      ),
    };
  }

  private obtenerMensajeError(error: unknown): string {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    const err = error as {
      error?: { message?: unknown } | string;
      message?: unknown;
    } | null;

    const mensajeBackend =
      typeof err?.error === 'string'
        ? err.error
        : err?.error?.message;

    const mensaje = mensajeBackend ?? err?.message;

    return typeof mensaje === 'string' &&
      mensaje.trim() &&
      !mensaje.trim().startsWith('<')
      ? mensaje
      : 'No se pudo guardar la zona. Intenta nuevamente.';
  }

  mostrarErrorMapa(mensaje: string): void {
    void Swal.fire({
      icon: 'error',
      title: 'No se pudo mostrar el editor del mapa',
      text: mensaje,
    });
  }
  // ============================================================
  // MODAL
  // ============================================================

  get tituloModal(): string {
    return this.modoEdicion ? 'Editar zona' : 'Registrar zona';
  }

  get textoBotonGuardar(): string {
    if (this.isLoading) return 'Guardando...';

    return this.modoEdicion
      ? 'Actualizar zona'
      : 'Registrar zona';
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

  cerrarModal(): void {
    if (this.isLoading) return;

    this.resetearFormulario();
    this.modalCerrado.emit();
  }
}
