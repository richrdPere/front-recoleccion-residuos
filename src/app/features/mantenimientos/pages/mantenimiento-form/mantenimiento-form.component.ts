
import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';

// Services
import { MantenimientoService } from '../../services/mantenimiento.service';

// Interfaces
import { CreateMantenimientoRequest, EstadoMantenimiento, MantenimientoDetalleData, MantenimientoIdentificador, TipoMantenimiento } from '../../interfaces/create-mantenimiento.interface';
import { UpdateMantenimientoRequest } from './../../interfaces/update-mantenimiento.interface';
import { MantenimientoPaginadoItem } from '../../interfaces';

export interface MantenimientoVehiculoOpcion {
  id_vehiculo: MantenimientoIdentificador;
  codigo: string;
  placa: string;
}

// *********************************************************
// UTILIDADES DE FECHAS
// *********************************************************

// Interpreta datetime-local como hora de Perú,
// independientemente de la zona horaria del navegador.
function fechaLocalPeruAISO(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, seconds] = match;

  const normalized =
    `${year}-${month}-${day}T${hour}:${minute}:${seconds ?? '00'}`;

  const date = new Date(`${normalized}-05:00`);

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  // Detecta fechas normalizadas por JavaScript,
  // por ejemplo un 30 de febrero.
  const local = new Date(
    date.getTime() - 5 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 19);

  return local === normalized
    ? `${normalized}-05:00`
    : null;
}

function fechaISOALocalPeru(value: string): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    throw new Error('La fecha recibida no es válida.');
  }

  return new Date(
    date.getTime() - 5 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 19);
}

function textoOpcional(value: string): string | null {
  return value.trim() || null;
}

// *********************************************************
// VALIDADORES
// *********************************************************

const textoNoVacio: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  return typeof value === 'string' && value.trim()
    ? null
    : { textoNoVacio: true };
};

const idValido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number.isInteger(Number(value)) && Number(value) > 0
    ? null
    : { idInvalido: true };
};

const identificadorValido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  return /^[1-9]\d*$/.test(String(control.value ?? ''))
    ? null
    : { identificadorInvalido: true };
};

const tipoPermitido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  return ['PREVENTIVO', 'CORRECTIVO'].includes(control.value)
    ? null
    : { opcionInvalida: true };
};

const fechaLocalValida: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  return fechaLocalPeruAISO(String(control.value ?? ''))
    ? null
    : { fechaInvalida: true };
};

const fechaValida: ValidatorFn = (control) => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { fechaInvalida: true };
  }

  const [anio, mes, dia] = value.split('-').map(Number);
  const fecha = new Date(0);

  fecha.setUTCHours(0, 0, 0, 0);
  fecha.setUTCFullYear(anio, mes - 1, dia);

  return (
    anio >= 1 &&
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  )
    ? null
    : { fechaInvalida: true };
};

const intervaloValido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const inicio = fechaLocalPeruAISO(
    control.get('fecha_inicio_programada')?.value ?? '',
  );

  const fin = fechaLocalPeruAISO(
    control.get('fecha_fin_programada')?.value ?? '',
  );

  if (!inicio || !fin) {
    return null;
  }

  return new Date(fin).getTime() > new Date(inicio).getTime()
    ? null
    : { intervaloInvalido: true };
};

// *********************************************************
// COMPONENTE
// *********************************************************
@Component({
  selector: 'mantenimiento-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './mantenimiento-form.component.html',
})
export class MantenimientoFormComponent implements OnChanges {


  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() mantenimientoSeleccionado: MantenimientoPaginadoItem | null = null;

  // Selectores
  @Input() vehiculosDisponibles: MantenimientoVehiculoOpcion[] = [];

  @Output() mantenimientoCreado = new EventEmitter<void>();
  @Output() modalCerrado = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================
  private readonly destroyRef = inject(DestroyRef);
  readonly formMantenimiento: FormGroup;

  isLoading = false;
  isSaving = false;
  modalWidthClass = 'max-w-4xl';

  errorCarga: string | null = null;
  mantenimiento: MantenimientoDetalleData | null = null;
  private cargaSubscription?: Subscription;

  readonly tiposMantenimiento: {
    value: TipoMantenimiento;
    label: string;
  }[] = [
      { value: 'PREVENTIVO', label: 'Preventivo' },
      { value: 'CORRECTIVO', label: 'Correctivo' },
    ];


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
    this.formMantenimiento = this.initFormulario();
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      if (changes['mostrarModal']) {
        this.resetFormulario();
      }
      return;
    }

    const debeSincronizar = !!changes['mostrarModal'] ||
      !!changes['modoEdicion'] ||
      !!changes['mantenimientoSeleccionado'];

    if (!debeSincronizar) {
      return;
    }

    if (this.modoEdicion && this.mantenimientoSeleccionado) {
      this.cargarMantenimiento(this.mantenimientoSeleccionado);
      return;
    }

    this.resetFormulario();
    this.setModalWidth('lg');

    this.cargaSubscription?.unsubscribe();
  }


  // ============================================================
  // FORMULARIO
  // ============================================================
  private initFormulario(): FormGroup {
    return this.fb.group({
      id_mantenimiento: [null],
      id_vehiculo: [null, [Validators.required, idValido]],
      tipo_mantenimiento: ['PREVENTIVO', [Validators.required]],
      fecha_inicio_programada: ['', [Validators.required, fechaLocalValida]],
      fecha_fin_programada: ['', [Validators.required, fechaLocalValida]],
      motivo: ['', [Validators.required, textoNoVacio]],
      diagnostico: [''],
      taller: ['', [Validators.required, textoNoVacio]],
      responsable_tecnico: ['', [Validators.required, textoNoVacio]],
      observacion: ['', [Validators.required, textoNoVacio]],
    });
  }

  private resetFormulario(): void {
    this.formMantenimiento.reset({
      id_mantenimiento: null,
      id_vehiculo: null,
      tipo_mantenimiento: 'PREVENTIVO',
      fecha_inicio_programada: '',
      fecha_fin_programada: '',
      motivo: '',
      diagnostico: '',
      taller: '',
      responsable_tecnico: '',
      observacion: '',
    });
  }

  private cargarMantenimiento(mant: MantenimientoPaginadoItem): void {

    console.log("MANT FORM: ", mant);

    this.formMantenimiento.reset({
      id_mantenimiento: mant.id_mantenimiento,
      id_vehiculo: mant.id_vehiculo,
      tipo_mantenimiento: mant.tipo_mantenimiento,
      fecha_inicio_programada: fechaISOALocalPeru(mant.fecha_inicio_programada),
      fecha_fin_programada: fechaISOALocalPeru(mant.fecha_fin_programada),
      motivo: mant.motivo,
      diagnostico: mant.diagnostico,
      taller: mant.taller,
      responsable_tecnico: mant.responsable_tecnico,
      observacion: mant.observacion,
    });
  }

  // ============================================================
  // CREAR / ACTUALIZAR
  // ============================================================
  crearOEditarMantenimiento(): void {
    if (this.isLoading) {
      return;
    }

    // this.normalizarCodigo();

    if (this.formMantenimiento.invalid) {
      this.formMantenimiento.markAllAsTouched();
      return;
    }

    const form = this.formMantenimiento.getRawValue();

    const fechaInicioISO = fechaLocalPeruAISO(String(form.fecha_inicio_programada ?? ''));
    const fechaFinISO = fechaLocalPeruAISO(String(form.fecha_fin_programada ?? ''));

    if (fechaInicioISO === null || fechaFinISO === null) {
      void Swal.fire({
        icon: 'error',
        title: 'No se pudo asignar fechas',
        text: 'Ingresa fechas de inicio y fin válidas.',
      });
      this.cdr.markForCheck();
      return;
    }

    const esEdicion = this.modoEdicion;
    const idMantenimiento = Number(form.id_mantenimiento);

    if (esEdicion && (!Number.isInteger(idMantenimiento) || idMantenimiento <= 0)) {
      void Swal.fire({
        icon: 'error',
        title: 'No se pudo identificar el personal',
        text: 'Selecciona nuevamente el registro que deseas editar.',
      });

      return;
    }

    const payload: CreateMantenimientoRequest = {
      id_vehiculo: Number(form.id_vehiculo),
      tipo_mantenimiento: form.tipo_mantenimiento,
      fecha_inicio_programada: fechaInicioISO,
      fecha_fin_programada: fechaFinISO,
      motivo: String(form.motivo ?? '').trim(),
      taller: String(form.taller ?? '').trim() || null,
      responsable_tecnico: String(form.responsable_tecnico ?? '').trim() || null,
      observacion: String(form.observacion ?? '').trim() || null,
    };

    // Supone que UpdatePersonalOperativoRequest acepta
    // los campos presentes en CreatePersonalOperativoRequest.
    const solicitud$ = esEdicion
      ? this.mantenimientoService.updateMantenimiento(idMantenimiento, payload)
      : this.mantenimientoService.createMantenimiento(payload);

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
              ? 'El mantenimiento fue actualizado correctamente'
              : 'El mantenimiento fue registrado correctamente',
          });

          this.mantenimientoCreado.emit();
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
              : 'No se pudo guardar el mantenimiento.',
          );
        },
      });
  }

  private mostrarError(esEdicion: boolean, mensaje: string): void {
    void Swal.fire({
      icon: 'error',
      title: esEdicion
        ? 'Error al actualizar personal'
        : 'Error al registrar personal',
      text: mensaje,
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  get textoBotonGuardar(): string {
    if (this.isLoading) {
      return 'Guardando...';
    }

    return this.modoEdicion
      ? 'Actualizar usuario'
      : 'Registrar usuario';
  }

  // - CERRAR MODAL
  cerrarModal(): void {
    if (this.isSaving) {
      return;
    }

    this.cargaSubscription?.unsubscribe();
    this.modalCerrado.emit();
  }

  // - COMPARAR VEHÍCULOS EN SELECT
  readonly compararVehiculos = (
    a: MantenimientoIdentificador | null,
    b: MantenimientoIdentificador | null,
  ): boolean => {
    if (a == null || b == null) {
      return a === b;
    }

    return String(a) === String(b);
  };


  // - ERRORES DEL FORMULARIO

  esRequerido(campo: string): boolean {
    const control = this.formMantenimiento.get(campo);

    return !!(
      control?.enabled &&
      control.hasValidator(Validators.required)
    );
  }

  campoInvalido(
    nombre: keyof typeof this.formMantenimiento.controls,
  ): boolean {
    const control = this.formMantenimiento.controls[nombre];

    return control.invalid &&
      (control.touched || control.dirty);
  }


  campoCompleto(campo: string): boolean {
    const control = this.formMantenimiento.get(campo);

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

  normalizarCampo(campo: string, convertirMayusculas = false): void {
    const control = this.formMantenimiento.get(campo);

    if (!control || typeof control.value !== 'string') {
      return;
    }

    const texto = control.value.trim().replace(/\s+/g, ' ');

    control.setValue(
      convertirMayusculas ? texto.toUpperCase() : texto,
      { emitEvent: false },
    );
  }


  obtenerError(campo: string): string {
    const control = this.formMantenimiento.get(campo);

    if (!control || !this.campoInvalido(campo)) {
      return '';
    }

    if (control.hasError('required')) {
      return campo === 'roles_ids'
        ? 'Selecciona al menos un rol.'
        : 'Este campo es obligatorio.';
    }

    if (control.hasError('textoVacio')) {
      return 'Ingresa un valor válido.';
    }

    if (control.hasError('email')) {
      return 'Ingresa un correo electrónico válido.';
    }

    if (control.hasError('maxlength')) {
      const limite = control.getError('maxlength').requiredLength;
      return `Se permiten como máximo ${limite} caracteres.`;
    }

    if (control.hasError('opcionInvalida')) {
      return 'Selecciona una opción válida.';
    }

    if (control.hasError('rolesInvalidos')) {
      return 'Los identificadores de los roles no son válidos.';
    }

    if (control.hasError('fechaInvalida')) {
      return 'Ingresa una fecha válida en formato YYYY-MM-DD.';
    }

    if (control.hasError('passwordCorta')) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (control.hasError('passwordLarga')) {
      return 'La contraseña no puede superar los 72 bytes.';
    }

    return 'Revisa el valor ingresado.';
  }
}
