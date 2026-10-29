import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { CodigosQrService } from '../../../services/codigos-qr.service';

// Interfaces
import { RegenerarCodigoQrData, RegenerarCodigoQrRequest } from '../../../interfaces/codigos-qr';

@Component({
  selector: 'codigo-qr-regenerar',
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './codigo-qr-regenerar.component.html',
  styles: ``,
})
export class CodigoQrRegenerarComponent implements OnChanges, OnDestroy {

  // Entradas y eventos
  @Input() mostrarModal = false;
  @Input() idCodigoQr: number | null = null;

  @Output() cerrar = new EventEmitter<void>();
  @Output() regenerado = new EventEmitter<RegenerarCodigoQrData>();

  // Formulario
  readonly regenerarForm;

  isSaving = false;
  modalWidthClass = 'max-w-4xl';
  errorMensaje = '';

  // Suscripción
  private consultaRegeneracion?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly codigosQrService: CodigosQrService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.regenerarForm = this.fb.nonNullable.group({
      motivo: ['', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idCodigoQr']) {
      this.consultaRegeneracion?.unsubscribe();

      this.regenerarForm.reset({
        motivo: '',
      });

      this.errorMensaje = '';
    }

    this.setModalWidth('md');
  }

  ngOnDestroy(): void {
    this.consultaRegeneracion?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================

  regenerarCodigoQr(): void {
    if (this.isSaving) {
      return;
    }

    this.errorMensaje = '';

    if (!this.idValido || this.idCodigoQr === null) {
      this.errorMensaje =
        'El identificador del código QR no es válido.';
      return;
    }

    const motivo = this.regenerarForm.controls.motivo.value.trim();

    this.regenerarForm.controls.motivo.setValue(motivo);
    this.regenerarForm.markAllAsTouched();

    if (this.regenerarForm.invalid) {
      return;
    }

    const request: RegenerarCodigoQrRequest = {
      motivo,
    };

    this.isSaving = true;
    this.cdr.markForCheck();

    this.consultaRegeneracion = this.codigosQrService
      .regenerarCodigoQr(this.idCodigoQr, request)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.errorMensaje = response.message ||
              'No se pudo regenerar el código QR.';
            return;
          }

          void Swal.fire({
            icon: 'success',
            title: 'Código QR regenerado',
            text: response.message ||
              'Se generó el nuevo código QR correctamente.',
            timer: 2000,
            showConfirmButton: false,
          });

          this.regenerado.emit(response.data);
        },

        error: (error: unknown) => {
          this.errorMensaje = this.obtenerMensajeError(
            error,
            'No se pudo regenerar el código QR.',
          );
        },
      });
  }

  // ================================
  // Helpers methods
  // ================================

  get idValido(): boolean {
    return (
      this.idCodigoQr !== null &&
      Number.isSafeInteger(this.idCodigoQr) &&
      this.idCodigoQr > 0
    );
  }

  private obtenerMensajeError(
    error: unknown,
    mensajePorDefecto: string,
  ): string {
    if (typeof error === 'string') {
      return error.trim() || mensajePorDefecto;
    }

    if (typeof error === 'object' && error !== null) {
      if ('error' in error) {
        const body = error.error;

        if (typeof body === 'string' && body.trim()) {
          return body;
        }

        if (
          typeof body === 'object' &&
          body !== null &&
          'message' in body &&
          typeof body.message === 'string' &&
          body.message.trim()
        ) {
          return body.message;
        }
      }

      if (
        'message' in error &&
        typeof error.message === 'string' &&
        error.message.trim()
      ) {
        return error.message;
      }
    }

    return mensajePorDefecto;
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
    const control = this.regenerarForm.get(campo);

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

  // ================================
  // Modal methods
  // ================================

  cerrarModal(): void {
    if (this.isSaving) {
      return;
    }

    this.cerrar.emit();
  }

}
