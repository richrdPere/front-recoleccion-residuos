import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { MantenimientoService } from '../../services/mantenimiento.service';

// Interfaces
import { CancelarMantenimientoRequest, MantenimientoDetalleData, MantenimientoPaginadoItem } from '../../interfaces';

// ============================================================
// VALIDADORES
// ============================================================

const textoNoVacio: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  return String(control.value ?? '').trim()
    ? null
    : { textoVacio: true };
};

// ============================================================
// COMPONENTE
// ============================================================

@Component({
  selector: 'cancelar-mantenimiento',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './cancelar-mantenimiento.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelarMantenimientoComponent implements OnChanges {

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================
  @Input() mostrarModal = false;
  @Input() mantenimientoSeleccionado: MantenimientoPaginadoItem | null = null;

  @Output() mantenimientoCancelado = new EventEmitter<MantenimientoDetalleData>();
  @Output() modalCerrado = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================

  private readonly destroyRef = inject(DestroyRef);
  readonly formCancelacion: FormGroup;

  isLoading = false;
  errorFormulario: string | null = null;
  modalWidthClass = 'max-w-xl';

  constructor(
    private readonly fb: FormBuilder,
    private readonly mantenimientoService: MantenimientoService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.formCancelacion = this.initFormulario();
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
      motivo_cancelacion: [
        '',
        [Validators.required, textoNoVacio],
      ],
    });
  }

  private resetFormulario(): void {
    this.formCancelacion.reset({
      motivo_cancelacion: '',
    });
  }

  // ============================================================
  // VALIDACIÓN PARA LA VISTA
  // ============================================================

  get puedeCancelar(): boolean {
    return this.mantenimientoSeleccionado?.estado_mantenimiento ===
      'PROGRAMADO';
  }

  campoInvalido(nombre: string): boolean {
    const control = this.formCancelacion.get(nombre);

    return !!control &&
      control.invalid &&
      (control.touched || control.dirty);
  }

  obtenerError(nombre: string): string {
    const control = this.formCancelacion.get(nombre);

    if (!control?.errors) {
      return '';
    }

    if (
      control.hasError('required') ||
      control.hasError('textoVacio')
    ) {
      return 'El motivo de cancelación es obligatorio.';
    }

    return 'Revisa el valor ingresado.';
  }

  // ============================================================
  // CANCELAR MANTENIMIENTO
  // ============================================================

  cancelar(): void {
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

    if (!this.puedeCancelar) {
      this.errorFormulario =
        'Solo se pueden cancelar mantenimientos programados.';
      return;
    }

    if (this.formCancelacion.invalid) {
      this.formCancelacion.markAllAsTouched();
      return;
    }

    const valores = this.formCancelacion.getRawValue();

    const request: CancelarMantenimientoRequest = {
      motivo_cancelacion:
        String(valores.motivo_cancelacion ?? '').trim(),
    };

    this.isLoading = true;
    this.cdr.markForCheck();

    this.mantenimientoService
      .cancelarMantenimiento(
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
              'No se pudo cancelar el mantenimiento.';

            this.cdr.markForCheck();
            return;
          }

          this.isLoading = false;

          void Swal.fire({
            icon: 'success',
            title: 'Mantenimiento cancelado',
            text: response.message,
          });

          this.mantenimientoCancelado.emit(response.data);
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
      : 'No se pudo cancelar el mantenimiento.';
  }
}
