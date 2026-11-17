import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription, finalize } from 'rxjs';

// Services
import { IncidenciasService } from '../../../../incidencias/services/incidencias.service';

// Interfaces
import { IncidenciaArchivoListadoItem, IncidenciaId } from '../../../../incidencias/interfaces';

// Componentes
import { IncidenciaEvidenciaImagenComponent } from '../../../../incidencias/pages/components/incidencia-evidencia-imagen/incidencia-evidencia-imagen.component';

@Component({
  selector: 'reporte-imagenes',
  standalone: true,
  imports: [
    IncidenciaEvidenciaImagenComponent,
  ],
  templateUrl: './reporte-imagenes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteImagenesComponent implements OnChanges, AfterViewInit, OnDestroy {

  @Input({ required: true })  idIncidencia!: IncidenciaId;

  @Output()  modalCerrado = new EventEmitter<void>();

  @ViewChild('dialogo', { static: true })
  private dialogo!: ElementRef<HTMLDialogElement>;

  imagenes: IncidenciaArchivoListadoItem[] = [];
  indiceActual = 0;

  cargando = false;
  errorMensaje = '';

  private consulta?: Subscription;
  private destruido = false;

  private readonly platformId = inject(PLATFORM_ID);

  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(): void {
    this.cargarImagenes();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.dialogo.nativeElement.showModal();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consulta?.unsubscribe();
  }

  get imagenActual(): IncidenciaArchivoListadoItem | null {
    return this.imagenes[this.indiceActual] ?? null;
  }

  cargarImagenes(): void {
    if (this.destruido) return;

    this.consulta?.unsubscribe();

    this.imagenes = [];
    this.indiceActual = 0;
    this.errorMensaje = '';
    this.cargando = false;

    const idValido = typeof this.idIncidencia === 'number'
      ? Number.isSafeInteger(this.idIncidencia) &&
      this.idIncidencia > 0
      : /^[1-9]\d*$/.test(this.idIncidencia ?? '');

    if (!idValido) {
      this.errorMensaje = 'El identificador del reporte no es válido.';
      this.cdr.markForCheck();
      return;
    }

    this.cargando = true;

    this.consulta = this.incidenciasService
      .getIncidenciaArchivos(this.idIncidencia)
      .pipe(
        finalize(() => {
          this.cargando = false;

          if (!this.destruido) {
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: response => {
          if (!response.success || !Array.isArray(response.data)) {
            this.errorMensaje = response.message ||
              'No se pudieron consultar las imágenes.';
            return;
          }

          this.imagenes = response.data.filter(
            archivo =>
              archivo.tipo_archivo === 'IMAGEN' &&
              archivo.estado &&
              !archivo.deleted_at,
          );
        },

        error: (error: unknown) => {
          this.errorMensaje = this.obtenerMensajeError(error);
        },
      });
  }

  anterior(): void {
    if (this.indiceActual > 0) {
      this.indiceActual--;
    }
  }

  siguiente(): void {
    if (this.indiceActual < this.imagenes.length - 1) {
      this.indiceActual++;
    }
  }

  cerrar(event?: Event): void {
    event?.preventDefault();
    this.dialogo.nativeElement.close();
  }

  notificarCierre(): void {
    if (!this.destruido) {
      this.modalCerrado.emit();
    }
  }

  private obtenerMensajeError(error: unknown): string {
    const respaldo = 'No se pudieron consultar las imágenes del reporte.';

    if (typeof error === 'string') {
      return error.trim() || respaldo;
    }

    if (!error || typeof error !== 'object') {
      return respaldo;
    }

    const objeto = error as {
      error?: { message?: unknown };
      details?: { message?: unknown };
      message?: unknown;
    };

    const mensajes = [
      objeto.error?.message,
      objeto.details?.message,
      objeto.message,
    ];

    return mensajes.find(
      (mensaje): mensaje is string =>
        typeof mensaje === 'string' &&
        mensaje.trim().length > 0,
    ) ?? respaldo;
  }
}
