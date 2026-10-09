import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';


// Services
import { PersonalService } from 'src/app/features/personal/services/personal.service';

// Interfaces
import { CreatePersonalOperativoRequest, EstadoLaboralPersonal, PersonalOperativoData, TipoContratoPersonal, TurnoPreferentePersonal } from '../../../models/personal_operativo';
import { UsuarioSelectorItem } from 'src/app/features/usuarios/interfaces';

// ============================================================
// OPCIONES PARA SELECTORES
// ============================================================

export interface UsuarioPersonalOption {
  id_usuario: number;
  nombre: string;
}

export interface PersonalSelectOption<T extends string> {
  value: T;
  label: string;
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

  return Number.isInteger(Number(value)) && Number(value) > 0
    ? null
    : { idInvalido: true };
};

const fechaValida: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (!value) {
    return null;
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { fechaInvalida: true };
  }

  const fecha = new Date(`${value}T00:00:00Z`);

  return (
    Number.isFinite(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === value
  )
    ? null
    : { fechaInvalida: true };
};

@Component({
  selector: 'personal-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UppercaseDirective,
  ],
  templateUrl: './personal-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalFormComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() personalSeleccionado: PersonalOperativoData | null = null;
  @Input() usuariosDisponibles: UsuarioSelectorItem[] = [];

  @Input() tiposContrato: PersonalSelectOption<TipoContratoPersonal>[] = [];
  @Input() turnosPreferentes: PersonalSelectOption<TurnoPreferentePersonal>[] = [];
  @Input() estadosLaborales: PersonalSelectOption<EstadoLaboralPersonal>[] = [];

  // Utilízalo si el usuario asignado ya no aparece en el listado.
  @Input() nombreUsuarioSeleccionado = '';

  @Output() modalCerrado = new EventEmitter<void>();

  // Se emite tanto al crear como al actualizar.
  @Output() personalGuardado = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================
  readonly formPersonal: FormGroup;

  isLoading = false;
  modalWidthClass = 'max-w-4xl';

  constructor(
    private readonly fb: FormBuilder,
    private readonly personalService: PersonalService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.formPersonal = this.crearFormulario();
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
      !!changes['personalSeleccionado'];

    if (!debeSincronizar) {
      return;
    }

    if (this.modoEdicion && this.personalSeleccionado) {
      this.cargarPersonal(this.personalSeleccionado);
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
      id_personal: [null],
      id_usuario: [null, [Validators.required, idValido]],
      codigo_empleado: ['', [Validators.required, textoNoVacio]],
      fecha_ingreso: ['', [Validators.required, fechaValida]],
      fecha_salida: ['', [Validators.required, fechaValida]],
      tipo_contrato: ['CONTRATADO', [Validators.required]],
      turno_preferente: [null],
      estado_laboral: [null],
      observacion: [''],
    });
  }

  private resetearFormulario(): void {
    this.formPersonal.reset({
      id_personal: null,
      id_usuario: null,
      codigo_empleado: '',
      fecha_ingreso: '',
      fecha_salida: '',
      tipo_contrato: null,
      turno_preferente: null,
      estado_laboral: null,
      observacion: '',
    });
  }

  private cargarPersonal(personal: PersonalOperativoData): void {
    this.formPersonal.reset({
      id_personal: personal.id_personal,
      id_usuario: personal.id_usuario,
      codigo_empleado: personal.codigo_empleado,
      fecha_ingreso: personal.fecha_ingreso?.slice(0, 10) ?? '',
      fecha_salida: personal.fecha_salida?.slice(0, 10) ?? '',
      tipo_contrato: personal.tipo_contrato,
      turno_preferente: personal.turno_preferente ?? null,
      estado_laboral: personal.estado_laboral ?? null,
      observacion: personal.observacion ?? '',
    });
  }

  // ============================================================
  // CREAR / ACTUALIZAR
  // ============================================================
  crearOEditarPersonal(): void {
    if (this.isLoading) {
      return;
    }

    this.normalizarCodigo();

    if (this.formPersonal.invalid) {
      this.formPersonal.markAllAsTouched();
      return;
    }

    const form = this.formPersonal.getRawValue();

    // Comprueba que los selectores contienen opciones permitidas.
    const contratoValido = this.tiposContrato.some(
      (opcion) => opcion.value === form.tipo_contrato,
    );

    const turnoValido = form.turno_preferente === null ||
      this.turnosPreferentes.some(
        (opcion) => opcion.value === form.turno_preferente,
      );

    const estadoValido = form.estado_laboral === null ||
      this.estadosLaborales.some(
        (opcion) => opcion.value === form.estado_laboral,
      );

    if (!contratoValido || !turnoValido || !estadoValido) {
      void Swal.fire({
        icon: 'warning',
        title: 'Revisa las opciones seleccionadas',
        text: 'Selecciona un contrato, turno y estado válidos.',
      });

      return;
    }

    const esEdicion = this.modoEdicion;
    const idPersonal = Number(form.id_personal);

    if (
      esEdicion &&
      (!Number.isInteger(idPersonal) || idPersonal <= 0)
    ) {
      void Swal.fire({
        icon: 'error',
        title: 'No se pudo identificar el personal',
        text: 'Selecciona nuevamente el registro que deseas editar.',
      });

      return;
    }

    const payload: CreatePersonalOperativoRequest = {
      id_usuario: Number(form.id_usuario),
      codigo_empleado: form.codigo_empleado,
      fecha_ingreso: form.fecha_ingreso,
      fecha_salida: form.fecha_salida,
      tipo_contrato: form.tipo_contrato,
      turno_preferente: form.turno_preferente ?? null,
      observacion: String(form.observacion ?? '').trim() || null,

      // Si no se selecciona un estado, se omite para que
      // el backend aplique su valor predeterminado.
      ...(form.estado_laboral !== null
        ? { estado_laboral: form.estado_laboral }
        : {}),
    };

    // Supone que UpdatePersonalOperativoRequest acepta
    // los campos presentes en CreatePersonalOperativoRequest.
    const solicitud$ = esEdicion
      ? this.personalService.updatePersonal(idPersonal, payload)
      : this.personalService.createPersonal(payload);

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
              ? 'Personal operativo actualizado correctamente'
              : 'Personal operativo registrado correctamente',
          });

          this.personalGuardado.emit();
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
              : 'No se pudo guardar el personal operativo.',
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
  getCodigo(): void {
    this.personalService
      .getLastCodigoPersonal()
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

          this.formPersonal.patchValue({
            codigo_empleado: resp.data.codigo,
          });

          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error('Error al obtener el código del vehículo:', error);
        },
      });
  }

  normalizarCodigo(): void {
    const control = this.formPersonal.get('codigo_empleado');

    control?.setValue(
      String(control.value ?? '').trim().toUpperCase(),
      { emitEvent: false },
    );
  }

  get usuarioSeleccionadoFueraDeLista(): boolean {
    const id = this.formPersonal.get('id_usuario')?.value;

    return (
      id !== null &&
      !this.usuariosDisponibles.some(
        (usuario) => usuario.id_usuario === Number(id),
      )
    );
  }

  campoInvalido(campo: string): boolean {
    const control = this.formPersonal.get(campo);

    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  obtenerError(campo: string): string {
    const control = this.formPersonal.get(campo);

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
      return 'Selecciona un usuario válido.';
    }

    if (control.hasError('fechaInvalida')) {
      return 'Ingresa una fecha válida.';
    }

    return 'Revisa el valor ingresado.';
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

  campoCompleto(campo: string): boolean {
    const control = this.formPersonal.get(campo);

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

  cerrarModal(): void {
    if (this.isLoading) {
      return;
    }

    this.resetearFormulario();
    this.modalCerrado.emit();
  }
}
