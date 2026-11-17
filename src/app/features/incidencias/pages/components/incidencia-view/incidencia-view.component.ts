import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, PLATFORM_ID, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription, finalize } from 'rxjs';

// Service
import { IncidenciasService } from '../../../services/incidencias.service';

// Interfaces
import { IncidenciaDetalleData, IncidenciaEstado, IncidenciaId, IncidenciaPrioridad } from '../../../interfaces';

type SeccionDetalle = 'informacion' | 'ubicacion' | 'evidencias';

// Componentes
import { IncidenciaEvidenciaImagenComponent } from '../incidencia-evidencia-imagen/incidencia-evidencia-imagen.component';

@Component({
  selector: 'incidencia-view',
  standalone: true,
  imports: [
    CommonModule,
    IncidenciaEvidenciaImagenComponent,
  ],
  templateUrl: './incidencia-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenciaViewComponent implements OnChanges, AfterViewInit, OnDestroy {

  // ==========================================================
  // ENTRADAS Y EVENTOS
  // ==========================================================
  @Input() mostrarModal = false;
  @Input() idIncidencia: IncidenciaId | null = null;
  @Input() seccionInicial: SeccionDetalle = 'informacion';
  @Input() tituloModal = 'Detalle de incidencia';

  // Permite que el padre solicite actualizar un detalle abierto.
  @Input() actualizacion = 0;

  @Output() modalCerrado = new EventEmitter<void>();

  @ViewChild('dialogo', { static: true })
  private dialogo?: ElementRef<HTMLDialogElement>;

  // ==========================================================
  // ESTADO
  // ==========================================================
  incidencia: IncidenciaDetalleData | null = null;

  isLoading = false;
  errorMensaje = '';

  seccionActiva: SeccionDetalle = 'informacion';

  private consulta?: Subscription;
  private destruido = false;

  private readonly platformId = inject(PLATFORM_ID);

  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // ==========================================================
  // CICLO DE VIDA
  // ==========================================================
  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      this.consulta?.unsubscribe();

      this.incidencia = null;
      this.errorMensaje = '';
      this.isLoading = false;

      this.sincronizarDialogo();
      return;
    }

    const seAbrio = changes['mostrarModal']?.currentValue === true;

    const cambioId = !!changes['idIncidencia'];
    const actualizar = !!changes['actualizacion'];
    const cambioSeccion = !!changes['seccionInicial'];

    if (seAbrio || cambioId) {
      this.seccionActiva = 'informacion';
    }

    if (seAbrio || cambioId || actualizar) {
      this.cargarDetalle();
    }

    this.sincronizarDialogo();
  }

  ngAfterViewInit(): void {
    this.sincronizarDialogo();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consulta?.unsubscribe();

    if (
      isPlatformBrowser(this.platformId) &&
      this.dialogo?.nativeElement.open
    ) {
      this.dialogo.nativeElement.close();
    }
  }

  // ==========================================================
  // DETALLE
  // ==========================================================
  cargarDetalle(): void {
    if (!this.mostrarModal || this.destruido) return;

    this.consulta?.unsubscribe();

    this.incidencia = null;
    this.errorMensaje = '';

    if (!this.idValido || this.idIncidencia === null) {
      this.errorMensaje =
        'El identificador de la incidencia no es válido.';

      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.consulta = this.incidenciasService
      .getIncidenciaById(this.idIncidencia)
      .pipe(
        finalize(() => {
          this.isLoading = false;

          if (!this.destruido) {
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: response => {
          if (!response.success || !response.data) {
            this.errorMensaje = response.message ||
              'No se pudo consultar la incidencia.';

            return;
          }

          this.incidencia = response.data;
        },

        error: (error: unknown) => {
          this.errorMensaje = this.obtenerMensajeError(
            error,
            'No se pudo consultar la incidencia.',
          );
        },
      });
  }

  // ==========================================================
  // GETTERS
  // ==========================================================
  get idValido(): boolean {
    if (typeof this.idIncidencia === 'number') {
      return Number.isSafeInteger(this.idIncidencia) &&
        this.idIncidencia > 0;
    }

    return typeof this.idIncidencia === 'string' &&
      /^[1-9]\d*$/.test(this.idIncidencia);
  }

  get archivos() {
    return this.incidencia?.archivos ?? [];
  }

  get coordenadas(): {
    latitud: number;
    longitud: number;
  } | null {
    const latitud = this.incidencia?.latitud;
    const longitud = this.incidencia?.longitud;

    if (
      latitud == null ||
      longitud == null ||
      !String(latitud).trim() ||
      !String(longitud).trim()
    ) {
      return null;
    }

    const lat = Number(latitud);
    const lng = Number(longitud);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }

    return {
      latitud: lat,
      longitud: lng,
    };
  }

  get enlaceMapa(): string | null {
    const coordenadas = this.coordenadas;

    if (!coordenadas) return null;

    const { latitud, longitud } = coordenadas;

    return 'https://www.openstreetmap.org/' +
      `?mlat=${latitud}&mlon=${longitud}` +
      `#map=17/${latitud}/${longitud}`;
  }

  // ==========================================================
  // PRESENTACIÓN
  // ==========================================================
  seleccionarSeccion(seccion: SeccionDetalle): void {
    this.seccionActiva = seccion;
  }

  getEstadoBadge(estado: IncidenciaEstado): string {
    switch (estado) {
      case 'REPORTADA':
        return 'badge-info';

      case 'EN_REVISION':
        return 'badge-warning';

      case 'EN_ATENCION':
        return 'badge-primary';

      case 'RESUELTA':
        return 'badge-success';

      case 'RECHAZADA':
        return 'badge-error';

      default:
        return 'badge-neutral';
    }
  }

  getPrioridadBadge(prioridad: IncidenciaPrioridad): string {
    switch (prioridad) {
      case 'CRITICA':
        return 'badge-error';

      case 'ALTA':
        return 'badge-warning';

      case 'MEDIA':
        return 'badge-info';

      default:
        return 'badge-neutral';
    }
  }

  formatearEtiqueta(valor: string): string {
    const texto = valor
      .replace(/_/g, ' ')
      .toLocaleLowerCase('es-PE');

    return texto.charAt(0).toLocaleUpperCase('es-PE') +
      texto.slice(1);
  }

  formatearTamano(valor: number | string): string {
    const bytes = Number(valor);

    if (!Number.isFinite(bytes) || bytes < 0) {
      return 'Tamaño no disponible';
    }

    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ==========================================================
  // MODAL
  // ==========================================================
  private sincronizarDialogo(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const dialogo = this.dialogo?.nativeElement;

    if (!dialogo) return;

    if (this.mostrarModal && !dialogo.open) {
      dialogo.showModal();
    } else if (!this.mostrarModal && dialogo.open) {
      dialogo.close();
    }
  }

  cerrarModal(event?: Event): void {
    event?.preventDefault();

    this.dialogo?.nativeElement.close();
  }

  notificarCierre(): void {
    this.consulta?.unsubscribe();

    if (!this.destruido && this.mostrarModal) {
      this.modalCerrado.emit();
    }
  }

  // ==========================================================
  // ERRORES
  // ==========================================================
  private obtenerMensajeError(
    error: unknown,
    respaldo: string,
  ): string {
    const texto = (valor: unknown): string | null =>
      typeof valor === 'string' && valor.trim()
        ? valor.trim()
        : null;

    const mensajeDe = (valor: unknown): string | null =>
      valor && typeof valor === 'object'
        ? texto((valor as { message?: unknown }).message)
        : null;

    if (!error || typeof error !== 'object') {
      return texto(error) ?? respaldo;
    }

    const objeto = error as {
      details?: unknown;
      error?: unknown;
      message?: unknown;
    };

    return mensajeDe(objeto.details) ??
      mensajeDe(objeto.error) ??
      texto(objeto.message) ??
      texto(objeto.error) ??
      respaldo;
  }
}
