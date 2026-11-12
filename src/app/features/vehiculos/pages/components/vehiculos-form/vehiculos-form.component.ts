import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, of, switchMap, throwError } from 'rxjs';
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
export class VehiculosFormComponent implements OnChanges, OnDestroy {


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

  // Fotos variables
  fotoActual: string | null = null;
  nuevaFoto: File | null = null;

  vistaPreviaFoto: string | null = null;
  fotoError: string | null = null;

  quitarFotoAlGuardar = false;

  private readonly maxFotoBytes = 5 * 1024 * 1024;

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
      // {
      //   value: 'CAMION_BARANDA',
      //   label: 'CAMIÓN BARANDA',
      // },
      {
        value: 'CAMION_VOLQUETE',
        label: 'CAMIÓN VOLQUETE',
      },
      {
        value: 'MOTOFURGON',
        label: 'MOTOFURGÓN',
      },
      // {
      //   value: 'OTRO',
      //   label: 'OTRO',
      // },
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
      {
        value: 'FUERA_DE_SERVICIO',
        label: 'FUERA DE SERVICIO',
      },
    ];

  @ViewChild('fotoInput')
  private fotoInput?: ElementRef<HTMLInputElement>;

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

  ngOnDestroy(): void {
    this.limpiarSeleccionFoto();
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
    this.prepararFoto();

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
    this.prepararFoto(
      vehiculo.foto_url ?? null,
    );

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

    if (
      this.formVehiculo.invalid ||
      this.fotoError
    ) {
      this.formVehiculo.markAllAsTouched();
      return;
    }

    const form =
      this.formVehiculo.getRawValue();

    const id = Number(
      form.id_vehiculo,
    );

    const tieneId = Number.isSafeInteger(id) && id > 0;

    if (
      this.modoEdicion &&
      !tieneId
    ) {
      void Swal.fire({
        icon: 'error',
        title: 'Vehículo no identificado',
        text:
          'Selecciona nuevamente el vehículo que deseas editar.',
      });

      return;
    }

    /*
     * Si una creación anterior guardó los datos pero falló
     * la foto, ya tendremos ID y actualizaremos ese vehículo.
     */
    const esEdicion = this.modoEdicion || tieneId;

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

    const fotoPendiente = this.nuevaFoto;
    const eliminarPendiente = this.quitarFotoAlGuardar;

    let datosGuardados = false;

    const solicitud$ = esEdicion
      ? this.vehiculosService.updateVehiculo(
        id,
        payload,
      )
      : this.vehiculosService.createVehiculo(
        payload,
      );

    this.isLoading = true;

    solicitud$
      .pipe(
        switchMap(response => {
          if (
            !response.success ||
            !response.data
          ) {
            return throwError(
              () => new Error(
                response.message ||
                'No se pudo guardar el vehículo.',
              ),
            );
          }

          datosGuardados = true;

          const vehiculo = response.data;

          /*
           * Conservar el ID incluso si la siguiente
           * petición, correspondiente a la foto, falla.
           */
          this.formVehiculo.patchValue({
            id_vehiculo: vehiculo.id_vehiculo,
          });

          this.fotoActual = vehiculo.foto_url;

          if (fotoPendiente) {
            return this.vehiculosService
              .subirFotoVehiculo(
                vehiculo.id_vehiculo,
                fotoPendiente,
              );
          }

          if (eliminarPendiente) {
            return this.vehiculosService
              .eliminarFotoVehiculo(
                vehiculo.id_vehiculo,
              );
          }

          return of(response);
        }),

        takeUntilDestroyed(
          this.destroyRef,
        ),

        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: response => {
          if (!response.success) {
            this.vehiculoCreado.emit();

            void Swal.fire({
              icon: 'warning',
              title: 'Revisa la fotografía',
              text:
                response.message ||
                'Los datos se guardaron, pero la fotografía requiere revisión.',
            });

            return;
          }

          this.isLoading = false;

          this.vehiculoCreado.emit();
          this.cerrarModal();

          void Swal.fire({
            icon: 'success',
            title: esEdicion
              ? 'Vehículo actualizado'
              : 'Vehículo registrado',
            text:
              'La información fue guardada correctamente.',
          });
        },

        error: error => {
          const mensaje = error?.error?.message ??
            error?.message ??
            'No se pudo completar la operación.';

          if (datosGuardados) {
            /*
             * Actualiza el listado porque el vehículo
             * ya existe aunque su foto no se haya guardado.
             */
            this.vehiculoCreado.emit();
          }

          void Swal.fire({
            icon: datosGuardados
              ? 'warning'
              : 'error',

            title: datosGuardados
              ? 'Datos guardados y fotografía pendiente'
              : 'No se pudo guardar el vehículo',

            text: datosGuardados
              ? `${mensaje} Puedes corregir la foto y volver a guardar; no se creará otro vehículo.`
              : mensaje,
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
  // FOTO - HELPERS
  // ============================================================

  get fotoMostrada(): string | null {
    if (this.vistaPreviaFoto) {
      return this.vistaPreviaFoto;
    }

    if (this.quitarFotoAlGuardar) {
      return null;
    }

    return this.vehiculosService.resolverFotoUrl(
      this.fotoActual,
    );
  }

  seleccionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;

    const archivo = input.files?.[0];

    // Permite seleccionar nuevamente el mismo archivo.
    input.value = '';

    if (!archivo || this.isLoading) {
      return;
    }

    this.limpiarSeleccionFoto();
    this.quitarFotoAlGuardar = false;

    const nombreValido = /\.(jpe?g|png)$/i.test(archivo.name);

    const tipoValido = [
      'image/jpeg',
      'image/png',
    ].includes(archivo.type);

    if (!nombreValido || !tipoValido) {
      this.fotoError =
        'Selecciona una imagen JPG, JPEG o PNG.';

      this.cdr.markForCheck();
      return;
    }

    if (archivo.size === 0 || archivo.size > this.maxFotoBytes) {
      this.fotoError = 'La fotografía debe tener contenido y no superar 5 MB.';

      this.cdr.markForCheck();
      return;
    }

    this.nuevaFoto = archivo;

    this.vistaPreviaFoto =
      URL.createObjectURL(archivo);

    this.cdr.markForCheck();
  }

  quitarFoto(): void {
    if (this.isLoading) {
      return;
    }

    this.limpiarSeleccionFoto();

    this.quitarFotoAlGuardar =
      this.fotoActual !== null;

    this.cdr.markForCheck();
  }

  restaurarFoto(): void {
    if (this.isLoading) {
      return;
    }

    this.limpiarSeleccionFoto();
    this.quitarFotoAlGuardar = false;

    this.cdr.markForCheck();
  }

  private limpiarSeleccionFoto(): void {
    if (this.vistaPreviaFoto) {
      URL.revokeObjectURL(
        this.vistaPreviaFoto,
      );
    }

    this.vistaPreviaFoto = null;
    this.nuevaFoto = null;
    this.fotoError = null;

    if (this.fotoInput) {
      this.fotoInput.nativeElement.value = '';
    }
  }

  private prepararFoto(
    ruta: string | null = null,
  ): void {
    this.limpiarSeleccionFoto();

    this.fotoActual = ruta;
    this.quitarFotoAlGuardar = false;
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

  get estadoOperativo(): string {
    const estado_operativo = this.formVehiculo.get('estado_operativo')?.value;

    return estado_operativo;
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
    this.cdr.markForCheck();
  }
}
