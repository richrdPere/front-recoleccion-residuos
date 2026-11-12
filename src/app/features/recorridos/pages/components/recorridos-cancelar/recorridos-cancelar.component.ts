import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { RecorridosService } from '../../../services/recorridos.service';

// Interfaces
import { HistorialFila } from '../../../interfaces/historial';
import { CancelarRecorridoRequest, CancelarRecorridoResponse } from '../../../interfaces/recorridos';

@Component({
  selector: 'recorridos-cancelar',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],

  templateUrl: './recorridos-cancelar.component.html',
  styles: ``,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecorridosCancelarComponent implements OnChanges, OnDestroy {

  // ==========================================================
  // INPUTS / OUTPUTS
  // ==========================================================
  @Input() mostrarModal = false;
  @Input() recorridoSeleccionado: HistorialFila | null = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() recorridoCancelado = new EventEmitter<CancelarRecorridoResponse['data']>();

  // ==========================================================
  // FORMULARIO
  // ==========================================================
  formCancelacion: FormGroup;

  readonly maxMotivo = 1000;
  readonly maxObservacion = 2000;

  // ==========================================================
  // ESTADO
  // ==========================================================
  isLoading = false;
  errorFormulario: string | null = null;

  modalWidthClass = 'max-w-xl';

  private solicitud?: Subscription;
  private destruido = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly recorridosService: RecorridosService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.formCancelacion = this.initFormulario();
  }

  // ==========================================================
  // CICLO DE VIDA
  // ==========================================================
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['mostrarModal'] ||
      changes['recorridoSeleccionado']
    ) {
      this.cancelarSolicitud();
      this.resetFormulario();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarSolicitud();
  }

  // ==========================================================
  // FORMULARIO
  // ==========================================================
  private initFormulario(): FormGroup {
    return this.fb.nonNullable.group({
      motivo: [
        '',
        [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(this.maxMotivo),
        ],
      ],

      observacion: [
        '',
        [
          Validators.maxLength(this.maxObservacion),
        ],
      ],
    });
  }

  private resetFormulario(): void {
    this.formCancelacion.enable({
      emitEvent: false,
    });

    this.formCancelacion.reset(
      {
        motivo: '',
        observacion: '',
      },
      {
        emitEvent: false,
      },
    );

    this.errorFormulario = null;
  }

  // ==========================================================
  // VALIDACIONES
  // ==========================================================
  get puedeCancelar(): boolean {
    const estado =
      this.recorridoSeleccionado?.estado;

    return (
      estado === 'EN_CURSO' ||
      estado === 'PAUSADO'
    );
  }

  campoInvalido(campo: string): boolean {
    const control =
      this.formCancelacion.get(campo);

    return !!(
      control &&
      control.invalid &&
      control.touched
    );
  }

  obtenerErrorCampo(campo: string): string {
    const control =
      this.formCancelacion.get(campo);

    if (!control?.errors) return '';

    if (
      control.hasError('required') ||
      control.hasError('pattern')
    ) {
      return 'Debe registrar un motivo de cancelación.';
    }

    if (control.hasError('maxlength')) {
      const maximo = campo === 'motivo'
        ? this.maxMotivo
        : this.maxObservacion;

      return `No puede superar los ${maximo} caracteres.`;
    }

    return 'Revisa el valor ingresado.';
  }

  // ==========================================================
  // CONFIRMAR CANCELACIÓN
  // ==========================================================
  confirmarCancelacion(): void {
    if (
      this.isLoading ||
      this.destruido ||
      !this.mostrarModal
    ) {
      return;
    }

    this.errorFormulario = null;

    const recorrido = this.recorridoSeleccionado;

    if (
      !recorrido ||
      !Number.isSafeInteger(recorrido.id_recorrido) ||
      recorrido.id_recorrido <= 0
    ) {
      this.errorFormulario =
        'Selecciona un recorrido válido.';

      this.marcarCambios();
      return;
    }

    if (!this.puedeCancelar) {
      this.errorFormulario =
        'Solo se pueden cancelar recorridos en curso o pausados.';

      this.marcarCambios();
      return;
    }

    const valores =
      this.formCancelacion.getRawValue();

    const motivo =
      String(valores.motivo ?? '').trim();

    const observacion =
      String(valores.observacion ?? '').trim();

    this.formCancelacion.patchValue(
      {
        motivo,
        observacion,
      },
      {
        emitEvent: false,
      },
    );

    this.formCancelacion.markAllAsTouched();

    if (this.formCancelacion.invalid) {
      this.marcarCambios();
      return;
    }

    const request: CancelarRecorridoRequest = {
      motivo,
      observacion: observacion || null,
    };

    this.isLoading = true;

    this.formCancelacion.disable({
      emitEvent: false,
    });

    this.marcarCambios();

    this.solicitud = this.recorridosService
      .cancelarRecorrido(
        recorrido.id_recorrido,
        request,
      )
      .pipe(
        finalize(() => {
          this.isLoading = false;

          if (!this.destruido) {
            this.formCancelacion.enable({
              emitEvent: false,
            });

            this.marcarCambios();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorFormulario =
              response.message ||
              'No se pudo cancelar el recorrido.';

            this.marcarCambios();
            return;
          }

          this.isLoading = false;

          this.recorridoCancelado.emit(
            response.data,
          );

          this.cerrarModal();

          void Swal.fire({
            icon: 'success',
            title: 'Recorrido cancelado',
            text:
              response.message ||
              'El recorrido fue cancelado correctamente.',
            timer: 2000,
            showConfirmButton: false,
          });
        },

        error: (error: unknown) => {
          this.errorFormulario =
            this.obtenerMensajeError(error);

          this.marcarCambios();
        },
      });
  }

  // ==========================================================
  // PRESENTACIÓN
  // ==========================================================
  obtenerEstado(estado: string): string {
    const estados: Record<string, string> = {
      EN_CURSO: 'En curso',
      PAUSADO: 'Pausado',
      FINALIZADO: 'Finalizado',
      CANCELADO: 'Cancelado',
    };

    return estados[estado] ??
      estado.replace(/_/g, ' ');
  }

  // ==========================================================
  // ERRORES
  // ==========================================================
  private obtenerMensajeError(error: unknown): string {
    const texto = (valor: unknown): string | null =>
      typeof valor === 'string' && valor.trim()
        ? valor.trim()
        : null;

    const mensajeDe = (
      valor: unknown,
    ): string | null => {
      if (!valor || typeof valor !== 'object') {
        return null;
      }

      return texto(
        (valor as { message?: unknown }).message,
      );
    };

    const directo = texto(error);

    if (directo) return directo;

    if (error && typeof error === 'object') {
      const objeto = error as {
        details?: unknown;
        error?: unknown;
        message?: unknown;
      };

      const mensaje =
        mensajeDe(objeto.details) ??
        mensajeDe(objeto.error) ??
        texto(objeto.message);

      if (mensaje) return mensaje;
    }

    return 'No se pudo cancelar el recorrido. Intenta nuevamente.';
  }

  // ==========================================================
  // MODAL
  // ==========================================================
  cerrarModal(): void {
    if (this.isLoading) return;

    this.resetFormulario();
    this.modalCerrado.emit();

    this.marcarCambios();
  }

  // ==========================================================
  // LIMPIEZA
  // ==========================================================
  private cancelarSolicitud(): void {
    this.solicitud?.unsubscribe();
    this.solicitud = undefined;
    this.isLoading = false;
  }

  private marcarCambios(): void {
    if (!this.destruido) {
      this.cdr.markForCheck();
    }
  }
}
