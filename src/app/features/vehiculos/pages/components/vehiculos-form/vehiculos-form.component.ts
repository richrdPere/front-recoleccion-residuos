import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Services
import { VehiculosService } from 'src/app/features/vehiculos/services/vehiculos.service';

// Interfaces
import { VehiculoData } from '../../../models';
import { CreateVehiculoRequest } from '../../../models/create-vehiculo.model';
import { EstadoOperativoVehiculo, TipoVehiculo, UnidadCapacidad } from '../../../models/data/vehiculo.types';

// ============================================================
// VALIDADORES
// ============================================================
const textoNoVacio: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  // Validators.required se encarga de los valores vacíos.
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return typeof value === 'string' && value.trim().length > 0
    ? null
    : { textoVacio: true };
};

const numeroFinito: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number.isFinite(Number(value))
    ? null
    : { numeroInvalido: true };
};

const numeroEntero: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number.isInteger(Number(value))
    ? null
    : { numeroEntero: true };
};

const numeroPositivo: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? null
    : { numeroPositivo: true };
};

function opcionPermitida(
  opciones: readonly string[],
): ValidatorFn {
  return (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    return opciones.includes(value)
      ? null
      : { opcionInvalida: true };
  };
}

@Component({
  selector: 'vehiculos-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    UppercaseDirective,
  ],
  templateUrl: './vehiculos-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiculosFormComponent implements OnChanges {


  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() vehiculoSeleccionado: VehiculoData | null = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() vehiculoCreado = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================
  readonly formVehiculo: FormGroup;
  private readonly destroyRef = inject(DestroyRef);

  isLoading = false;
  modalWidthClass = 'max-w-4xl';

  // Límites de interfaz: ajústalos a las reglas de tu backend.
  readonly anioMinimo = 1900;
  readonly anioMaximo = new Date().getFullYear() + 1;

  // ============================================================
  // SELECTORES
  // ============================================================
  readonly tiposVehiculo: {
    value: TipoVehiculo;
    label: string;
  }[] = [
      {
        value: 'CAMION_COMPACTADOR',
        label: 'CAMIÓN COMPACTADOR',
      },
      {
        value: 'CAMION_BARANDA',
        label: 'CAMIÓN BARANDA',
      },
      {
        value: 'CAMION_VOLQUETE',
        label: 'CAMIÓN VOLQUETE',
      },
      {
        value: 'MOTOFURGON',
        label: 'MOTOFURGÓN',
      },
      {
        value: 'OTRO',
        label: 'OTRO',
      },
    ];

  readonly unidadesCapacidad: {
    value: UnidadCapacidad;
    label: string;
  }[] = [
      {
        value: 'TONELADA',
        label: 'TONELADAS',
      },
      {
        value: 'KILOGRAMO',
        label: 'KILOGRAMOS',
      },
      {
        value: 'METRO_CUBICO',
        label: 'METROS CÚBICOS',
      },
    ];

  readonly estadosOperativos: {
    value: EstadoOperativoVehiculo;
    label: string;
  }[] = [
      {
        value: 'DISPONIBLE',
        label: 'DISPONIBLE',
      },
      {
        value: 'EN_RUTA',
        label: 'EN RUTA',
      },
      {
        value: 'EN_MANTENIMIENTO',
        label: 'EN MANTENIMIENTO',
      },
      // {
      //   value: 'FUERA_DE_SERVICIO',
      //   label: 'Fuera de servicio',
      // },
    ];

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    private readonly fb: FormBuilder,
    private readonly vehiculosService: VehiculosService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    // Se crea antes del primer ngOnChanges para poder recibir
    // un vehículo seleccionado desde la primera renderización.
    this.formVehiculo = this.crearFormulario();
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
      !!changes['vehiculoSeleccionado'];

    if (!debeSincronizar) {
      return;
    }

    if (this.modoEdicion && this.vehiculoSeleccionado) {
      this.cargarVehiculo(this.vehiculoSeleccionado);
      return;
    }

    this.resetearFormulario();
    this.getCodigo();
    this.setModalWidth('lg');
  }

  // ============================================================
  // FORMULARIO
  // ============================================================
  private crearFormulario(): FormGroup {
    return this.fb.group({
      id_vehiculo: [null],
      codigo: ['', [Validators.required, textoNoVacio],],
      placa: ['', [Validators.required, textoNoVacio]],
      marca: ['', [Validators.required, textoNoVacio]],
      modelo: ['', [Validators.required, textoNoVacio]],
      anio: [null, [Validators.required, numeroFinito, numeroEntero, Validators.min(this.anioMinimo), Validators.max(this.anioMaximo),]],
      color: ['', [Validators.required, textoNoVacio]],
      tipo_vehiculo: ['CAMION_COMPACTADOR', [Validators.required, opcionPermitida(this.tiposVehiculo.map((opcion) => opcion.value),),]],
      capacidad_maxima: [null, [Validators.required, numeroFinito, numeroPositivo]],
      unidad_capacidad: ['TONELADA', [Validators.required, opcionPermitida(this.unidadesCapacidad.map((opcion) => opcion.value)),]],
      kilometraje: [0, [Validators.required, numeroFinito, Validators.min(0)]],
      estado_operativo: ['DISPONIBLE', [Validators.required, opcionPermitida(this.estadosOperativos.map((opcion) => opcion.value)),]],
      observacion: [''],
      estado: [true],
    });
  }

  private resetearFormulario(): void {
    this.formVehiculo.reset({
      id_vehiculo: null,
      codigo: '',
      placa: '',
      marca: '',
      modelo: '',
      anio: null,
      color: '',
      tipo_vehiculo: 'CAMION_COMPACTADOR',
      capacidad_maxima: null,
      unidad_capacidad: 'TONELADA',
      kilometraje: 0,
      estado_operativo: 'DISPONIBLE',
      observacion: '',
      estado: true,
    });
  }

  private cargarVehiculo(vehiculo: VehiculoData): void {
    this.formVehiculo.reset({
      id_vehiculo: vehiculo.id_vehiculo,
      codigo: vehiculo.codigo,
      placa: vehiculo.placa,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      color: vehiculo.color,
      tipo_vehiculo: vehiculo.tipo_vehiculo,
      capacidad_maxima: vehiculo.capacidad_maxima,
      unidad_capacidad: vehiculo.unidad_capacidad,
      kilometraje: vehiculo.kilometraje,
      estado_operativo: vehiculo.estado_operativo,
      observacion: vehiculo.observacion ?? '',
      estado: vehiculo.estado ?? true,
    });
  }

  // ============================================================
  // CREAR / ACTUALIZAR
  // ============================================================
  crearOEditarVehiculo(): void {
    if (this.isLoading) {
      return;
    }

    this.normalizarCamposTexto();

    if (this.formVehiculo.invalid) {
      this.formVehiculo.markAllAsTouched();
      return;
    }

    const form = this.formVehiculo.getRawValue();

    // Evita crear por accidente cuando se esperaba editar.
    if (
      this.modoEdicion &&
      (!Number.isInteger(Number(form.id_vehiculo)) ||
        Number(form.id_vehiculo) <= 0)
    ) {
      void Swal.fire({
        icon: 'error',
        title: 'No se pudo identificar el vehículo',
        text: 'Selecciona nuevamente el vehículo que deseas editar.',
      });

      return;
    }

    const payload: CreateVehiculoRequest = {
      codigo: form.codigo,
      placa: form.placa,
      marca: form.marca,
      modelo: form.modelo,
      anio: Number(form.anio),
      color: form.color,
      tipo_vehiculo: form.tipo_vehiculo,
      capacidad_maxima: Number(form.capacidad_maxima),
      unidad_capacidad: form.unidad_capacidad,
      kilometraje: Number(form.kilometraje),
      estado_operativo: form.estado_operativo,
      observacion: form.observacion || null,
      estado: form.estado === true,
    };

    const esEdicion = this.modoEdicion;

    const solicitud$ = esEdicion
      ? this.vehiculosService.updateVehiculo(
        Number(form.id_vehiculo),
        payload,
      )
      : this.vehiculosService.createVehiculo(payload);

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
            void Swal.fire({
              icon: 'error',
              title: esEdicion
                ? 'No se pudo actualizar el vehículo'
                : 'No se pudo crear el vehículo',
              text: response.message || 'La operación no fue completada.',
            });

            return;
          }

          // Permite cerrar después de guardar correctamente.
          this.isLoading = false;

          void Swal.fire({
            icon: 'success',
            title: esEdicion
              ? 'Vehículo actualizado correctamente'
              : 'Vehículo creado correctamente',
          });

          this.vehiculoCreado.emit();
          this.cerrarModal();
        },

        error: (err) => {
          const mensaje = err?.error?.message ?? err?.message;

          void Swal.fire({
            icon: 'error',
            title: esEdicion
              ? 'Error al actualizar vehículo'
              : 'Error al crear vehículo',
            text:
              typeof mensaje === 'string' && mensaje.trim()
                ? mensaje
                : 'No se pudo guardar el vehículo. Intenta nuevamente.',
          });
        },
      });
  }

  // ============================================================
  // NORMALIZACIÓN DE TEXTO
  // ============================================================
  private normalizarCamposTexto(): void {
    const form = this.formVehiculo.getRawValue();

    this.formVehiculo.patchValue(
      {
        codigo: this.normalizarTexto(form.codigo).toUpperCase(),
        placa: this.normalizarTexto(form.placa).toUpperCase(),
        marca: this.normalizarTexto(form.marca),
        modelo: this.normalizarTexto(form.modelo),
        color: this.normalizarTexto(form.color),
        observacion: String(form.observacion ?? '').trim(),
      },
      { emitEvent: false },
    );
  }

  private normalizarTexto(value: unknown): string {
    return String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  normalizarCampo(
    campo: string,
    convertirMayusculas = false,
  ): void {
    const control = this.formVehiculo.get(campo);

    if (!control || typeof control.value !== 'string') {
      return;
    }

    const texto = this.normalizarTexto(control.value);

    control.setValue(
      convertirMayusculas ? texto.toUpperCase() : texto,
    );
  }

  // ============================================================
  // VALIDACIONES PARA EL HTML
  // ============================================================
  getCodigo(): void {
    this.vehiculosService
      .getLastCodigoVehiculo()
      .subscribe({
        next: (resp) => {
          // Evita aplicar la respuesta si se cerró el modal
          // o se cambió a modo edición mientras cargaba.
          if (!this.mostrarModal || this.modoEdicion) {
            return;
          }

          if (!resp.success || !resp.data?.codigo) {
            return;
          }

          this.formVehiculo.patchValue({
            codigo: resp.data.codigo,
          });

          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error('Error al obtener el código del vehículo:', error);
        },
      });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formVehiculo.get(campo);

    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  esRequerido(campo: string): boolean {
    return (
      this.formVehiculo
        .get(campo)
        ?.hasValidator(Validators.required) ?? false
    );
  }

  obtenerError(campo: string): string {
    const control = this.formVehiculo.get(campo);

    if (!control || !this.campoInvalido(campo)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('textoVacio')) {
      return 'Ingresa un valor válido.';
    }

    if (control.hasError('numeroInvalido')) {
      return 'Ingresa un número válido.';
    }

    if (control.hasError('numeroEntero')) {
      return 'Ingresa un número entero.';
    }

    if (control.hasError('numeroPositivo')) {
      return 'La capacidad debe ser mayor que cero.';
    }

    if (control.hasError('min')) {
      return campo === 'anio'
        ? `El año mínimo permitido es ${this.anioMinimo}.`
        : 'El valor no puede ser negativo.';
    }

    if (control.hasError('max')) {
      return campo === 'anio'
        ? `El año máximo permitido es ${this.anioMaximo}.`
        : 'El valor supera el máximo permitido.';
    }

    if (control.hasError('opcionInvalida')) {
      return 'Selecciona una opción válida.';
    }

    return 'Revisa el valor ingresado.';
  }

  campoCompleto(campo: string): boolean {
    const control = this.formVehiculo.get(campo);

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

  // ============================================================
  // HELPERS
  // ============================================================
  get tituloModal(): string {
    return this.modoEdicion
      ? 'Editar vehículo'
      : 'Registrar vehículo';
  }

  get textoBotonGuardar(): string {
    if (this.isLoading) {
      return 'Guardando...';
    }

    return this.modoEdicion
      ? 'Actualizar vehículo'
      : 'Registrar vehículo';
  }

  get simboloCapacidad(): string {
    const unidad = this.formVehiculo.get('unidad_capacidad')?.value;

    switch (unidad) {
      case 'TONELADA':
        return 't';

      case 'KILOGRAMO':
        return 'kg';

      case 'METRO_CUBICO':
        return 'm³';

      default:
        return '';
    }
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
    if (this.isLoading) {
      return;
    }

    this.resetearFormulario();
    this.modalCerrado.emit();
  }
}
