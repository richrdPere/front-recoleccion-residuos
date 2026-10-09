import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { finalize, firstValueFrom, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { RecoleccionesService } from '../../../services/recolecciones.service';

// Interfaces
import { AnularRecoleccionRequest, PuntoRecorridoRecoleccion } from '../../../interfaces';

// *********************************************************
// VALIDADOR
// *********************************************************
const textoNoVacio: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const valor = String(control.value ?? '');

  if (!valor) {
    return null;
  }

  return valor.trim() ? null : { textoNoVacio: true };
};

@Component({
  selector: 'app-recoleccion-anular',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './recoleccion-anular.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoleccionAnularComponent
  implements OnChanges, OnDestroy {
  // ================================
  // Inputs / Outputs
  // ================================
  @Input() mostrarModal = false;
  @Input() idRecoleccion: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  @Output() recoleccionAnulada =
    new EventEmitter<PuntoRecorridoRecoleccion>();

  // ================================
  // Estado
  // ================================
  isSaving = false;
  errorFormulario: string | null = null;

  private readonly destroy$ = new Subject<void>();
  private destruido = false;
  private contexto = 0;

  // ================================
  // Formulario
  // ================================
  readonly form = new FormGroup({
    motivo_anulacion: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        textoNoVacio,
      ],
    }),
  });

  constructor(
    private recoleccionesService: RecoleccionesService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !changes['mostrarModal'] &&
      !changes['idRecoleccion']
    ) {
      return;
    }

    this.contexto++;

    if (this.mostrarModal && !this.isSaving) {
      this.reiniciarFormulario();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;

    this.destroy$.next();
    this.destroy$.complete();
  }

  // ================================
  // Methods
  // ================================
  async anularRecoleccion(): Promise<void> {
    if (this.isSaving) {
      return;
    }

    this.errorFormulario = null;
    this.form.markAllAsTouched();

    const id = this.idRecoleccion;

    if (
      id === null ||
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      this.errorFormulario =
        'El identificador de la recolección no es válido.';
      this.cdr.markForCheck();
      return;
    }

    if (this.form.invalid) {
      return;
    }

    const request: AnularRecoleccionRequest = {
      motivo_anulacion:
        this.form.controls.motivo_anulacion.value.trim(),
    };

    const contextoActual = this.contexto;

    // Bloquea nuevos envíos y el cierre durante la operación.
    this.isSaving = true;
    this.form.disable({ emitEvent: false });
    this.cdr.markForCheck();

    try {
      const confirmacion = await Swal.fire({
        icon: 'warning',
        title: '¿Anular recolección?',
        text: `Se anulará la recolección #${id} con el motivo indicado.`,
        showCancelButton: true,
        confirmButtonText: 'Sí, anular',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        reverseButtons: true,
        focusCancel: true,
      });

      if (
        !confirmacion.isConfirmed ||
        this.destruido ||
        contextoActual !== this.contexto ||
        !this.mostrarModal
      ) {
        return;
      }

      const response = await firstValueFrom(
        this.recoleccionesService
          .anularRecoleccion(id, request)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
              if (!this.destruido) {
                this.cdr.markForCheck();
              }
            }),
          ),
      );

      if (this.destruido) {
        return;
      }

      if (!response.success || !response.data) {
        this.errorFormulario =
          response.message ||
          'No se pudo anular la recolección.';

        void Swal.fire({
          icon: 'error',
          title: 'No se pudo anular',
          text: this.errorFormulario,
        });

        return;
      }

      // Entrega los datos confirmados por el backend.
      this.recoleccionAnulada.emit(response.data);

      // Evita cerrar otro contexto si el padre cambió la selección.
      if (contextoActual === this.contexto) {
        this.modalCerrado.emit();
      }

      void Swal.fire({
        icon: 'success',
        title: 'Recolección anulada',
        text: response.message,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error: unknown) {
      if (!this.destruido) {
        const mensaje = this.obtenerMensajeError(error);

        if (contextoActual === this.contexto) {
          this.errorFormulario = mensaje;
        }

        void Swal.fire({
          icon: 'error',
          title: 'No se pudo anular la recolección',
          text: mensaje,
        });
      }
    } finally {
      this.isSaving = false;

      if (!this.destruido) {
        this.form.enable({ emitEvent: false });

        if (
          contextoActual !== this.contexto &&
          this.mostrarModal
        ) {
          this.reiniciarFormulario();
        }

        this.cdr.markForCheck();
      }
    }
  }

  // ================================
  // Helpers methods
  // ================================
  get motivoInvalido(): boolean {
    const control = this.form.controls.motivo_anulacion;

    return control.invalid && control.touched;
  }

  private reiniciarFormulario(): void {
    this.errorFormulario = null;

    this.form.reset({
      motivo_anulacion: '',
    });

    this.cdr.markForCheck();
  }

  private obtenerMensajeError(error: unknown): string {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    const err = error as {
      error?: { message?: unknown } | string;
      message?: unknown;
    } | null;

    const mensajeBackend = typeof err?.error === 'string'
      ? err.error
      : err?.error?.message;

    const mensaje = mensajeBackend ?? err?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'Ocurrió un error al anular la recolección.';
  }

  // ================================
  // Modales methods
  // ================================
  cerrarModal(): void {
    if (this.isSaving) {
      return;
    }

    this.modalCerrado.emit();
  }
}
