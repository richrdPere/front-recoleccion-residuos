import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { finalize, Subscription } from 'rxjs';

// Service
import { CodigosQrService } from '../../../services/codigos-qr.service';

// Interfaces
import { CodigoQrDetalleData } from '../../../interfaces/codigos-qr';

@Component({
  selector: 'codigo-qr-view',
  imports: [
    CommonModule,
  ],
  templateUrl: './codigo-qr-view.component.html',
  styles: ``,
})
export class CodigoQrViewComponent implements OnChanges, OnDestroy {

  // Entradas y eventos
  @Input() mostrarModal = false;
  @Input() idCodigoQr: number | null = null;

  @Output() cerrar = new EventEmitter<void>();

  // Detalle
  codigoQr: CodigoQrDetalleData | null = null;

  isLoading = false;
    modalWidthClass = 'max-w-4xl';
  errorMensaje = '';

  // Suscripción
  private consultaDetalle?: Subscription;

  constructor(
    private readonly codigosQrService: CodigosQrService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idCodigoQr']) {
      this.cargarCodigoQr();
    }
  }

  ngOnDestroy(): void {
    this.consultaDetalle?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================

  cargarCodigoQr(): void {
    this.consultaDetalle?.unsubscribe();

    this.codigoQr = null;
    this.errorMensaje = '';

    if (!this.idValido || this.idCodigoQr === null) {
      this.errorMensaje =
        'El identificador del código QR no es válido.';

      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.consultaDetalle = this.codigosQrService
      .getCodigoQrById(this.idCodigoQr)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.errorMensaje = response.message ||
              'No se pudo obtener el código QR.';
            return;
          }

          if (!response.data) {
            this.errorMensaje =
              'No se encontró información del código QR.';
            return;
          }

          this.codigoQr = response.data;
        },

        error: (error: unknown) => {
          this.errorMensaje = this.obtenerMensajeError(
            error,
            'No se pudo obtener el código QR.',
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

  obtenerCampoAsociacion(
    asociacion: Record<string, unknown> | null,
    campo: string,
  ): string | null {
    if (!asociacion) {
      return null;
    }

    const valor = asociacion[campo];

    if (typeof valor === 'string') {
      return valor.trim() || null;
    }

    if (
      typeof valor === 'number' &&
      Number.isFinite(valor)
    ) {
      return String(valor);
    }

    return null;
  }

  obtenerReferenciaCodigo(
    asociacion: Record<string, unknown> | null,
    idAlternativo: number | null = null,
  ): string {
    const codigo = this.obtenerCampoAsociacion(
      asociacion,
      'codigo',
    );

    if (codigo) {
      return codigo;
    }

    const id = this.obtenerCampoAsociacion(
      asociacion,
      'id_codigo_qr',
    );

    if (id) {
      return `QR #${id}`;
    }

    return idAlternativo !== null
      ? `QR #${idAlternativo}`
      : 'Referencia disponible sin detalle';
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

  // ================================
  // Modal methods
  // ================================

  cerrarModal(): void {
    this.cerrar.emit();
  }

}
