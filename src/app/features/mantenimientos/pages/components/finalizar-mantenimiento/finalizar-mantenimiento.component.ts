import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { MantenimientoService } from '../../../services/mantenimiento.service';

// Interfaces
import { FinalizarMantenimientoRequest, MantenimientoDetalleData, MantenimientoPaginadoItem } from '../../../interfaces';


// ============================================================
// UTILIDADES Y VALIDADORES
// ============================================================

function estaVacio(value: unknown): boolean {
  return value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '');
}

function textoOpcional(value: unknown): string | null {
  const texto = String(value ?? '').trim();

  return texto || null;
}

const textoNoVacio: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  return String(control.value ?? '').trim()
    ? null
    : { textoVacio: true };
};

const decimalNoNegativo: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (estaVacio(control.value)) {
    return null;
  }

  const valor = String(control.value).trim();

  // Hasta dos decimales, usando punto como separador.
  if (!/^\d+(?:\.\d{1,2})?$/.test(valor)) {
    return { decimalInvalido: true };
  }

  const numero = Number(valor);

  return Number.isFinite(numero) && numero >= 0
    ? null
    : { decimalInvalido: true };
};

const booleanoRequerido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  return typeof control.value === 'boolean'
    ? null
    : { booleanoRequerido: true };
};

// ============================================================
// COMPONENTE
// ============================================================

@Component({
  selector: 'finalizar-mantenimiento',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './finalizar-mantenimiento.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalizarMantenimientoComponent implements OnChanges {
  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() mostrarModal = false;

  @Input()
  mantenimientoSeleccionado: MantenimientoPaginadoItem | null = null;

  @Output()
  mantenimientoFinalizado = new EventEmitter<MantenimientoDetalleData>();

  @Output()
  modalCerrado = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================

  private readonly destroyRef = inject(DestroyRef);

  readonly formFinalizacion: FormGroup;

  isLoading = false;
  errorFormulario: string | null = null;
  modalWidthClass = 'max-w-4xl';

  constructor(
    private readonly fb: FormBuilder,
    private readonly mantenimientoService: MantenimientoService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.formFinalizacion = this.initFormulario();
  }

  // ============================================================
  // ANCHO DEL MODAL
  // ============================================================

  setModalWidth(size: 'sm' | 'md' | 'lg' | 'xl' | 'full'): void {
    const clases = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full w-[95vw]',
    };

    this.modalWidthClass = clases[size];
    this.cdr.markForCheck();
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['mostrarModal'] ||
      changes['mantenimientoSeleccionado']
    ) {
      if (this.isLoading) {
        return;
      }

      this.resetFormulario();
      this.errorFormulario = null;
    }
  }

  // ============================================================
  // FORMULARIO
  // ============================================================

  private initFormulario(): FormGroup {
    return this.fb.group({
      trabajos_realizados: [
        '',
        [Validators.required, textoNoVacio],
      ],

      vehiculo_operativo: [
        null,
        [booleanoRequerido],
      ],

      kilometraje_salida: [
        null,
        [decimalNoNegativo],
      ],

      diagnostico: [''],

      responsable_tecnico: [
        '',
        [Validators.maxLength(150)],
      ],

      taller: [
        '',
        [Validators.maxLength(150)],
      ],

      costo_total: [
        null,
        [decimalNoNegativo],
      ],

      observacion: [''],
    });
  }

  private resetFormulario(): void {
    const mantenimiento = this.mantenimientoSeleccionado;

    this.formFinalizacion.reset({
      trabajos_realizados: mantenimiento?.trabajos_realizados ?? '',
      vehiculo_operativo: null,

      // Opcional: el backend determina el valor si no se envía.
      kilometraje_salida: mantenimiento?.kilometraje_salida ?? null,

      diagnostico: mantenimiento?.diagnostico ?? '',
      responsable_tecnico: mantenimiento?.responsable_tecnico ?? '',
      taller: mantenimiento?.taller ?? '',
      costo_total: mantenimiento?.costo_total ?? null,
      observacion: mantenimiento?.observacion ?? '',
    });
  }

  // ============================================================
  // VALIDACIÓN PARA LA VISTA
  // ============================================================

  get puedeFinalizar(): boolean {
    return this.mantenimientoSeleccionado?.estado_mantenimiento ===
      'EN_PROCESO';
  }

  campoInvalido(nombre: string): boolean {
    const control = this.formFinalizacion.get(nombre);

    return !!control &&
      control.invalid &&
      (control.touched || control.dirty);
  }

  campoCompleto(nombre: string): boolean {
    const control = this.formFinalizacion.get(nombre);

    return !!control &&
      control.valid &&
      !estaVacio(control.value);
  }

  esRequerido(nombre: string): boolean {
    return nombre === 'trabajos_realizados' ||
      nombre === 'vehiculo_operativo';
  }

  obtenerError(nombre: string): string {
    const control = this.formFinalizacion.get(nombre);

    if (!control?.errors) {
      return '';
    }

    if (
      control.hasError('required') ||
      control.hasError('textoVacio')
    ) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('booleanoRequerido')) {
      return 'Selecciona si el vehículo quedó operativo.';
    }

    if (control.hasError('decimalInvalido')) {
      return 'Ingresa un número mayor o igual a cero con hasta dos decimales.';
    }

    if (control.hasError('maxlength')) {
      const maximo = control.errors['maxlength'].requiredLength;

      return `El campo admite hasta ${maximo} caracteres.`;
    }

    return 'Revisa el valor ingresado.';
  }

  // ============================================================
  // FINALIZAR MANTENIMIENTO
  // ============================================================

  finalizar(): void {
    if (this.isLoading) {
      return;
    }

    this.errorFormulario = null;

    const mantenimiento = this.mantenimientoSeleccionado;

    if (!mantenimiento) {
      this.errorFormulario = 'Selecciona un mantenimiento.';
      return;
    }

    const id = String(mantenimiento.id_mantenimiento).trim();

    if (!/^[1-9]\d*$/.test(id)) {
      this.errorFormulario =
        'El identificador del mantenimiento no es válido.';
      return;
    }

    if (!this.puedeFinalizar) {
      this.errorFormulario =
        'Solo se pueden finalizar mantenimientos en proceso.';
      return;
    }

    if (this.formFinalizacion.invalid) {
      this.formFinalizacion.markAllAsTouched();
      return;
    }

    const valores = this.formFinalizacion.getRawValue();

    // Acepta tanto true como false.
    if (typeof valores.vehiculo_operativo !== 'boolean') {
      this.errorFormulario =
        'Selecciona si el vehículo quedó operativo.';
      return;
    }

    const request: FinalizarMantenimientoRequest = {
      trabajos_realizados:
        String(valores.trabajos_realizados ?? '').trim(),

      vehiculo_operativo: valores.vehiculo_operativo,

      diagnostico: textoOpcional(valores.diagnostico),
      responsable_tecnico: textoOpcional(valores.responsable_tecnico),
      taller: textoOpcional(valores.taller),
      observacion: textoOpcional(valores.observacion),
    };

    // No envía campos numéricos vacíos.
    if (!estaVacio(valores.kilometraje_salida)) {
      const kilometrajeSalida = Number(valores.kilometraje_salida);

      if (mantenimiento.kilometraje_ingreso !== null) {
        const kilometrajeIngreso = Number(
          mantenimiento.kilometraje_ingreso,
        );

        if (
          Number.isFinite(kilometrajeIngreso) &&
          kilometrajeSalida < kilometrajeIngreso
        ) {
          this.errorFormulario =
            'El kilometraje de salida no puede ser menor al de ingreso.';
          return;
        }
      }

      // Conserva el decimal como cadena para enviarlo.
      request.kilometraje_salida = String(valores.kilometraje_salida).trim();
    }

    if (!estaVacio(valores.costo_total)) {
      request.costo_total = String(valores.costo_total).trim();
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.mantenimientoService.finalizarMantenimiento(
      mantenimiento.id_mantenimiento,
      request,
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorFormulario =
              response.message ||
              'No se pudo finalizar el mantenimiento.';

            this.cdr.markForCheck();
            return;
          }

          this.isLoading = false;

          void Swal.fire({
            icon: 'success',
            title: 'Mantenimiento finalizado',
            text: response.message,
          });

          this.mantenimientoFinalizado.emit(response.data);
          this.modalCerrado.emit();
        },

        error: (error: unknown) => {
          this.errorFormulario = this.obtenerMensajeError(error);
          this.cdr.markForCheck();
        },
      });
  }

  // ============================================================
  // CERRAR MODAL
  // ============================================================

  cerrarModal(): void {
    if (this.isLoading) {
      return;
    }

    this.modalCerrado.emit();
  }

  // ============================================================
  // MENSAJE DEL ERROR
  // ============================================================

  private obtenerMensajeError(error: unknown): string {
    const respuesta = error as {
      error?: { message?: unknown };
      message?: unknown;
    } | null;

    const mensaje =
      respuesta?.error?.message ??
      respuesta?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'No se pudo finalizar el mantenimiento.';
  }
}
