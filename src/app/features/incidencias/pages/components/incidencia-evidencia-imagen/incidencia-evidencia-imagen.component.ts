import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { Subscription, finalize, timeout } from 'rxjs';

// Services
import { IncidenciasService } from 'src/app/features/incidencias/services/incidencias.service';

// Interfaces
import { IncidenciaId } from 'src/app/features/incidencias/interfaces';

@Component({
  selector: 'incidencia-evidencia-imagen',
  standalone: true,
  templateUrl: './incidencia-evidencia-imagen.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenciaEvidenciaImagenComponent implements OnChanges, OnDestroy {

  @Input({ required: true }) idIncidencia!: IncidenciaId;
  @Input({ required: true }) idArchivo!: IncidenciaId;
  @Input() descripcion = 'Evidencia de la incidencia';

  imagenUrl: string | null = null;
  cargando = false;
  errorMensaje = '';
  ampliada = false;

  private readonly platformId = inject(PLATFORM_ID);

  private consulta?: Subscription;
  private revision = 0;
  private destruido = false;

  constructor(
    private readonly service: IncidenciasService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(): void {
    this.cargarImagen();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.revision++;

    this.consulta?.unsubscribe();
    this.limpiarImagen();
  }

  cargarImagen(): void {
    if (this.destruido) return;

    const revision = ++this.revision;

    this.consulta?.unsubscribe();
    this.limpiarImagen();

    this.errorMensaje = '';
    this.ampliada = false;
    this.cargando = false;

    if (!isPlatformBrowser(this.platformId)) return;

    if (
      !this.idValido(this.idIncidencia) ||
      !this.idValido(this.idArchivo)
    ) {
      this.errorMensaje = 'El identificador de la evidencia no es válido.';
      this.cdr.markForCheck();
      return;
    }

    this.cargando = true;
    this.cdr.markForCheck();

    this.consulta = this.service
      .getArchivoContenido(
        this.idIncidencia,
        this.idArchivo,
      )
      .pipe(
        timeout(30_000),
        finalize(() => {
          if (!this.esActual(revision)) return;

          this.cargando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: blob => {
          if (!this.esActual(revision)) return;

          const mime = blob.type
            .split(';')[0]
            .trim()
            .toLowerCase();

          const compatibles = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
          ];

          if (blob.size === 0) {
            this.errorMensaje = 'El archivo de imagen está vacío.';
            return;
          }

          if (!compatibles.includes(mime)) {
            this.errorMensaje =
              'El archivo no tiene un formato de imagen compatible ' +
              'con esta vista previa.';
            return;
          }

          this.imagenUrl = URL.createObjectURL(blob);
        },

        error: (error: unknown) => {
          if (!this.esActual(revision)) return;

          const status = (
            error as { status?: number } | null
          )?.status;

          switch (status) {
            case 401:
              this.errorMensaje =
                'Tu sesión no permite cargar la evidencia. ' +
                'Vuelve a iniciar sesión.';
              break;

            case 403:
              this.errorMensaje =
                'No tienes permisos para consultar esta evidencia.';
              break;

            case 404:
              this.errorMensaje =
                'La evidencia ya no está disponible.';
              break;

            default:
              this.errorMensaje =
                'No se pudo cargar la imagen. Intenta nuevamente.';
          }
        },
      });
  }

  alternarAmpliacion(): void {
    this.ampliada = !this.ampliada;
  }

  onErrorImagen(url: string): void {
    // Ignorar eventos tardíos de una imagen anterior.
    if (this.destruido || this.imagenUrl !== url) return;

    this.limpiarImagen();
    this.ampliada = false;

    this.errorMensaje =
      'El navegador no pudo mostrar la imagen. ' +
      'El archivo puede estar dañado o utilizar un formato no compatible.';

    this.cdr.markForCheck();
  }

  private limpiarImagen(): void {
    if (this.imagenUrl) {
      URL.revokeObjectURL(this.imagenUrl);
      this.imagenUrl = null;
    }
  }

  private esActual(revision: number): boolean {
    return !this.destruido && revision === this.revision;
  }

  private idValido(id: IncidenciaId): boolean {
    if (typeof id === 'number') {
      return Number.isSafeInteger(id) && id > 0;
    }

    return typeof id === 'string' && /^[1-9]\d*$/.test(id);
  }
}
