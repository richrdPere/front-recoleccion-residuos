import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { RutasServices } from 'src/app/features/rutas/services/rutas.service';

// Interfaces
import { CreateRutaRequest, RutaData } from '../../../interfaces/rutas/create-ruta.interface';
import { UpdateRutaRequest } from '../../../interfaces/rutas/update-ruta.interface';

// ============================================================
// OPCIONES DEL SELECTOR DE ZONAS
// ============================================================
export interface RutaZonaOption {
  id_zona: number;
  nombre: string;
}

// ============================================================
// VALIDADORES
// ============================================================
const textoNoVacio: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return typeof value === 'string' && value.trim().length > 0
    ? null
    : { textoVacio: true };
};

const idValido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  const id = Number(value);

  return Number.isInteger(id) && id > 0
    ? null
    : { idInvalido: true };
};

@Component({
  selector: 'rutas-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './ruta-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutasFormComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() rutaSeleccionada: RutaData | null = null;

  @Input() zonas: RutaZonaOption[] = [];

  @Output() modalCerrado = new EventEmitter<void>();

  // Se emite después de crear o actualizar.
  @Output() rutaGuardada = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================

  readonly formRuta: FormGroup;

  isLoading = false;
  modalWidthClass = 'max-w-4xl';

  readonly colorPredeterminado = '#2563EB';

  constructor(
    private readonly fb: FormBuilder,
    private readonly rutasService: RutasServices,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.formRuta = this.crearFormulario();
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      if (changes['mostrarModal']) {
        this.resetearFormulario();
      }

      return;
    }

    const debeSincronizar =
      !!changes['mostrarModal'] ||
      !!changes['modoEdicion'] ||
      !!changes['rutaSeleccionada'];

    // Actualizar la lista de zonas no borra los datos del formulario.
    if (!debeSincronizar) {
      return;
    }

    if (this.modoEdicion) {
      if (this.rutaSeleccionada) {
        this.cargarRuta(this.rutaSeleccionada);
      } else {
        this.resetearFormulario();
      }

      return;
    }

    this.resetearFormulario();
  }

  // ============================================================
  // FORMULARIO
  // ============================================================

  private crearFormulario(): FormGroup {
    return this.fb.group({
      id_ruta: [null],

      id_zona: [
        null,
        [Validators.required, idValido],
      ],

      codigo: [
        '',
        [Validators.required, textoNoVacio],
      ],

      nombre: [
        '',
        [Validators.required, textoNoVacio],
      ],

      descripcion: [
        '',
        [Validators.required, textoNoVacio],
      ],

      // El selector de color utiliza el formato #RRGGBB.
      color: [
        this.colorPredeterminado,
        [
          Validators.required,
          Validators.pattern(/^#[0-9A-Fa-f]{6}$/),
        ],
      ],
    });
  }

  private resetearFormulario(): void {
    // Recupera los controles deshabilitados durante la edición.
    this.formRuta.get('id_zona')?.enable({ emitEvent: false });
    this.formRuta.get('codigo')?.enable({ emitEvent: false });

    this.formRuta.reset({
      id_ruta: null,
      id_zona: null,
      codigo: '',
      nombre: '',
      descripcion: '',
      color: this.colorPredeterminado,
    });
  }

  private cargarRuta(ruta: RutaData): void {
    this.formRuta.reset({
      id_ruta: ruta.id_ruta,
      id_zona: ruta.id_zona,
      codigo: ruta.codigo,
      nombre: ruta.nombre,
      descripcion: ruta.descripcion,
      color: ruta.color,
    });

    // UpdateRutaRequest no permite cambiar zona ni código.
    this.formRuta.get('id_zona')?.disable({ emitEvent: false });
    this.formRuta.get('codigo')?.disable({ emitEvent: false });
  }

  // ============================================================
  // CREAR / ACTUALIZAR
  // ============================================================

  crearOEditarRuta(): void {
    if (this.isLoading) {
      return;
    }

    this.normalizarCampos();

    if (this.formRuta.invalid) {
      this.formRuta.markAllAsTouched();
      return;
    }

    // Incluye zona y código aunque estén deshabilitados.
    const form = this.formRuta.getRawValue();

    const esEdicion = this.modoEdicion;
    const idRuta = Number(form.id_ruta);

    if (
      esEdicion &&
      (!Number.isInteger(idRuta) || idRuta <= 0)
    ) {
      this.mostrarError(
        true,
        'Selecciona nuevamente la ruta que deseas editar.',
      );
      return;
    }

    if (
      !esEdicion &&
      !this.zonas.some(
        (zona) => zona.id_zona === Number(form.id_zona),
      )
    ) {
      this.mostrarError(
        false,
        'Selecciona una zona válida de la lista.',
      );
      return;
    }

    const payloadCrear: CreateRutaRequest = {
      id_zona: Number(form.id_zona),
      codigo: form.codigo,
      nombre: form.nombre,
      descripcion: form.descripcion,
      color: form.color,
    };

    // Solo los campos permitidos para actualizar.
    const payloadActualizar: UpdateRutaRequest = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      color: form.color,
    };

    const solicitud$ = esEdicion
      ? this.rutasService.updateRuta(idRuta, payloadActualizar)
      : this.rutasService.createRuta(payloadCrear);

    this.isLoading = true;

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
            this.mostrarError(
              esEdicion,
              response.message || 'La operación no fue completada.',
            );
            return;
          }

          this.isLoading = false;

          void Swal.fire({
            icon: 'success',
            title: esEdicion
              ? 'Ruta actualizada correctamente'
              : 'Ruta registrada correctamente',
          });

          this.rutaGuardada.emit();
          this.cerrarModal();
        },

        error: (err) => {
          const mensaje =
            err?.error?.message ??
            err?.message;

          this.mostrarError(
            esEdicion,
            typeof mensaje === 'string' && mensaje.trim()
              ? mensaje
              : 'No se pudo guardar la ruta. Intenta nuevamente.',
          );
        },
      });
  }

  private mostrarError(esEdicion: boolean, mensaje: string): void {
    void Swal.fire({
      icon: 'error',
      title: esEdicion
        ? 'Error al actualizar ruta'
        : 'Error al registrar ruta',
      text: mensaje,
    });
  }

  // ============================================================
  // NORMALIZACIÓN
  // ============================================================

  normalizarCampo(
    campo: 'codigo' | 'nombre',
    mayusculas = false,
  ): void {
    const control = this.formRuta.get(campo);

    if (!control || control.disabled) {
      return;
    }

    const texto = String(control.value ?? '')
      .trim()
      .replace(/\s+/g, ' ');

    control.setValue(mayusculas ? texto.toUpperCase() : texto);
  }

  private normalizarCampos(): void {
    this.normalizarCampo('codigo', true);
    this.normalizarCampo('nombre');

    const form = this.formRuta.getRawValue();

    this.formRuta.patchValue({
      descripcion: String(form.descripcion ?? '').trim(),
      color: String(form.color ?? '').trim().toUpperCase(),
    });
  }

  // ============================================================
  // VALIDACIONES PARA HTML
  // ============================================================

  campoInvalido(campo: string): boolean {
    const control = this.formRuta.get(campo);

    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  obtenerError(campo: string): string {
    const control = this.formRuta.get(campo);

    if (!control || !this.campoInvalido(campo)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('textoVacio')) {
      return 'Ingresa un valor válido.';
    }

    if (control.hasError('idInvalido')) {
      return 'Selecciona una zona válida.';
    }

    if (control.hasError('pattern') && campo === 'color') {
      return 'Usa un color hexadecimal de seis dígitos. Ejemplo: #2563EB.';
    }

    return 'Revisa el valor ingresado.';
  }

  // ============================================================
  // HELPERS
  // ============================================================
  get zonaSeleccionadaFueraDeLista(): boolean {
    const idZona = this.formRuta.get('id_zona')?.value;

    return (
      this.modoEdicion &&
      idZona !== null &&
      !this.zonas.some((zona) => zona.id_zona === Number(idZona))
    );
  }

  get colorVistaPrevia(): string {
    const color = this.formRuta.get('color')?.value;

    return typeof color === 'string' &&
      /^#[0-9A-Fa-f]{6}$/.test(color)
      ? color
      : this.colorPredeterminado;
  }

  cerrarModal(): void {
    if (this.isLoading) {
      return;
    }

    this.resetearFormulario();
    this.modalCerrado.emit();
  }
}
