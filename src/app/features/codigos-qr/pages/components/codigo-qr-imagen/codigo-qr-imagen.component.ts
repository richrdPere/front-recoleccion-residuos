import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

// Service
import { CodigosQrService } from '../../../services/codigos-qr.service';

// Interfaces
import { GetCodigoQrImagenParams } from '../../../interfaces/codigos-qr';

@Component({
  selector: 'codigo-qr-imagen',
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './codigo-qr-imagen.component.html',
  styles: ``,
})
export class CodigoQrImagenComponent implements OnChanges, OnDestroy {


  // Entradas y eventos
  @Input() mostrarModal = false;
  @Input() idCodigoQr: number | null = null;

  @Output() cerrar = new EventEmitter<void>();

  // Imagen
  imagenUrl: string | null = null;
  private imagenBlob: Blob | null = null;

  isLoading = false;
  modalWidthClass = 'max-w-4xl';
  errorMensaje = '';

  // Opciones
  formato: 'PNG' | 'SVG' = 'PNG';
  width = 512;
  margin = 4;

  readonly formatosDisponibles: Array<'PNG' | 'SVG'> = [
    'PNG',
    'SVG',
  ];

  // Configuración de la imagen mostrada.
  parametrosImagen: GetCodigoQrImagenParams | null = null;

  // Suscripciones
  private consultaImagen?: Subscription;

  constructor(
    private readonly codigosQrService: CodigosQrService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idCodigoQr']) {
      this.consultaImagen?.unsubscribe();
      this.liberarImagen();

      this.errorMensaje = '';

      if (this.idValido) {
        this.cargarImagen();
      } else {
        this.errorMensaje = 'El identificador del código QR no es válido.';
      }
    }
  }

  ngOnDestroy(): void {
    this.consultaImagen?.unsubscribe();
    this.liberarImagen();
  }

  // ================================
  // Methods
  // ================================

  cargarImagen(): void {
    if (!this.idValido || this.idCodigoQr === null) {
      this.errorMensaje = 'El identificador del código QR no es válido.';
      return;
    }

    if (!this.opcionesValidas) {
      this.errorMensaje =
        'El ancho debe ser un entero positivo y el margen un entero mayor o igual a cero.';
      return;
    }

    // Cancela la solicitud anterior antes de consultar otra imagen.
    this.consultaImagen?.unsubscribe();
    this.liberarImagen();

    const params: GetCodigoQrImagenParams = {
      formato: this.formato,
      width: Number(this.width),
      margin: Number(this.margin),
      download: false,
    };

    this.isLoading = true;
    this.errorMensaje = '';
    this.cdr.markForCheck();

    this.consultaImagen = this.codigosQrService
      .getCodigoQrImagen(this.idCodigoQr, params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (blob) => {
          if (blob.size === 0) {
            this.errorMensaje =
              'El servidor devolvió una imagen vacía.';
            return;
          }

          // Conserva un MIME correcto para la vista previa.
          const tipoImagen = params.formato === 'SVG'
            ? 'image/svg+xml'
            : 'image/png';

          this.imagenBlob = new Blob(
            [blob],
            { type: tipoImagen },
          );

          this.parametrosImagen = { ...params };
          this.imagenUrl = URL.createObjectURL(this.imagenBlob);
        },

        error: (error: unknown) => {
          this.errorMensaje = this.obtenerMensajeError(
            error,
            'No se pudo obtener la imagen del código QR.',
          );
        },
      });
  }

  descargarImagen(): void {
    if (
      this.isLoading ||
      !this.imagenBlob ||
      !this.parametrosImagen ||
      this.idCodigoQr === null
    ) {
      return;
    }

    // Usa el formato de la imagen cargada, aunque el usuario
    // haya cambiado el selector sin actualizar la vista previa.
    const extension = this.parametrosImagen.formato === 'SVG'
      ? 'svg'
      : 'png';

    const url = URL.createObjectURL(this.imagenBlob);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = `codigo-qr-${this.idCodigoQr}.${extension}`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  onErrorImagen(): void {
    this.liberarImagen();

    this.errorMensaje =
      'No se pudo visualizar la imagen recibida. Intenta cargarla nuevamente.';

    this.cdr.markForCheck();
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

  get opcionesValidas(): boolean {
    return (
      (this.formato === 'PNG' || this.formato === 'SVG') &&
      Number.isInteger(this.width) &&
      this.width > 0 &&
      Number.isInteger(this.margin) &&
      this.margin >= 0
    );
  }

  get hayCambiosPendientes(): boolean {
    if (!this.parametrosImagen) {
      return false;
    }

    return (
      this.formato !== this.parametrosImagen.formato ||
      this.width !== this.parametrosImagen.width ||
      this.margin !== this.parametrosImagen.margin
    );
  }


  private liberarImagen(): void {
    if (this.imagenUrl) {
      URL.revokeObjectURL(this.imagenUrl);
    }

    this.imagenUrl = null;
    this.imagenBlob = null;
    this.parametrosImagen = null;
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
