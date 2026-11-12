import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';

import { Subscription, finalize } from 'rxjs';

// Services
import { HistorialService } from '../../../services/historial.service';

// Interfaces
import { HistorialDetalle, HistorialTrazado } from '../../../interfaces/historial';

// Componentes
import { HistorialMapaComponent } from '../historial-mapa/historial-mapa.component';

type PestanaRecorrido =
  | 'resumen'
  | 'equipo'
  | 'puntos'
  | 'trazado'
  | 'eventos'
  | 'incidencias'
  | 'resultado';

@Component({
  selector: 'recorridos-view',
  standalone: true,

  imports: [
    CommonModule,
    HistorialMapaComponent,
  ],

  templateUrl: './recorridos-view.component.html',
  styles: ``,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecorridosViewComponent
  implements OnChanges, OnDestroy {

  // ==========================================================
  // INPUTS / OUTPUTS
  // ==========================================================
  @Input() mostrarModal = false;
  @Input() recorrido_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  @ViewChild('contenidoModal')
  private contenidoModal?: ElementRef<HTMLDivElement>;

  // ==========================================================
  // DATOS
  // ==========================================================
  detalle: HistorialDetalle | null = null;
  trazado: HistorialTrazado | null = null;

  // ==========================================================
  // ESTADOS
  // ==========================================================
  loading = false;
  loadingTrazado = false;

  errorCarga: string | null = null;
  errorTrazado: string | null = null;

  modalWidthClass = 'max-w-6xl';

  private trazadoConsultado = false;
  private destruido = false;

  private cargaSubscription?: Subscription;
  private trazadoSubscription?: Subscription;

  // ==========================================================
  // PESTAÑAS
  // ==========================================================
  pestanaActiva: PestanaRecorrido = 'resumen';

  readonly pestanas: ReadonlyArray<{
    id: PestanaRecorrido;
    etiqueta: string;
    icono: string;
  }> = [
      {
        id: 'resumen',
        etiqueta: 'Resumen',
        icono: 'fa-solid fa-circle-info',
      },
      {
        id: 'equipo',
        etiqueta: 'Equipo',
        icono: 'fa-solid fa-users',
      },
      {
        id: 'puntos',
        etiqueta: 'Atenciones',
        icono: 'fa-solid fa-location-dot',
      },
      {
        id: 'trazado',
        etiqueta: 'Trazado GPS',
        icono: 'fa-solid fa-map-location-dot',
      },
      {
        id: 'eventos',
        etiqueta: 'Eventos y pausas',
        icono: 'fa-solid fa-clock-rotate-left',
      },
      {
        id: 'incidencias',
        etiqueta: 'Incidencias',
        icono: 'fa-solid fa-triangle-exclamation',
      },
      {
        id: 'resultado',
        etiqueta: 'Resultado',
        icono: 'fa-solid fa-scale-balanced',
      },
    ];

  constructor(
    private readonly historialService: HistorialService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // ==========================================================
  // CICLO DE VIDA
  // ==========================================================
  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      this.cancelarConsultas();
      this.limpiarDatos();
      return;
    }

    if (
      changes['mostrarModal'] ||
      changes['recorrido_id']
    ) {
      this.cargarDatosRecorrido();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarConsultas();
  }

  // ==========================================================
  // CARGAR DETALLE
  // ==========================================================
  cargarDatosRecorrido(): void {
    if (this.destruido) return;

    this.cancelarConsultas();
    this.limpiarDatos();

    if (!this.mostrarModal) {
      return;
    }

    const id = this.recorrido_id;

    if (
      id === null ||
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      this.errorCarga =
        'Selecciona un recorrido válido.';

      this.marcarCambios();
      return;
    }

    this.loading = true;
    this.marcarCambios();

    this.cargaSubscription = this.historialService
      .getHistorialDetalle(id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.marcarCambios();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorCarga =
              response.message ||
              'No se pudo obtener el detalle del recorrido.';

            this.marcarCambios();
            return;
          }

          this.detalle = response.data;
          this.errorCarga = null;

          this.marcarCambios();
        },

        error: (error: unknown) => {
          this.detalle = null;

          this.errorCarga = this.obtenerMensajeError(
            error,
            'No se pudo obtener el detalle del recorrido.',
          );

          this.marcarCambios();
        },
      });
  }

  // ==========================================================
  // CARGAR TRAZADO BAJO DEMANDA
  // ==========================================================
  cargarTrazado(): void {
    if (
      this.destruido ||
      !this.mostrarModal ||
      !this.detalle ||
      this.loadingTrazado
    ) {
      return;
    }

    const id = this.detalle.recorrido.id_recorrido;

    this.trazadoSubscription?.unsubscribe();

    this.trazado = null;
    this.errorTrazado = null;
    this.trazadoConsultado = false;
    this.loadingTrazado = true;

    this.marcarCambios();

    this.trazadoSubscription = this.historialService
      .getHistorialTrazado(id)
      .pipe(
        finalize(() => {
          this.loadingTrazado = false;
          this.marcarCambios();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorTrazado =
              response.message ||
              'No se pudo obtener el trazado GPS.';

            this.marcarCambios();
            return;
          }

          const datos = response.data;

          // Comprobar que el endpoint devuelve el trazado,
          // no el objeto del detalle del historial.
          if (
            datos.geojson?.type !== 'FeatureCollection' ||
            !Array.isArray(datos.geojson.features)
          ) {
            this.errorTrazado =
              'El servidor no devolvió un trazado GPS válido.';

            this.marcarCambios();
            return;
          }

          this.trazado = datos;
          this.trazadoConsultado = true;

          this.marcarCambios();
        },

        error: (error: unknown) => {
          this.errorTrazado = this.obtenerMensajeError(
            error,
            'No se pudo obtener el trazado GPS.',
          );

          this.marcarCambios();
        },
      });
  }

  // ==========================================================
  // NAVEGACIÓN DE PESTAÑAS
  // ==========================================================
  seleccionarPestana(
    pestana: PestanaRecorrido,
  ): void {
    this.pestanaActiva = pestana;

    this.contenidoModal?.nativeElement.scrollTo({
      top: 0,
    });

    if (
      pestana === 'trazado' &&
      !this.trazadoConsultado &&
      !this.loadingTrazado
    ) {
      this.cargarTrazado();
    }

    this.marcarCambios();
  }

  navegarPestanas(
    event: KeyboardEvent,
    indiceActual: number,
  ): void {
    let nuevoIndice: number;

    switch (event.key) {
      case 'ArrowRight':
        nuevoIndice =
          (indiceActual + 1) % this.pestanas.length;
        break;

      case 'ArrowLeft':
        nuevoIndice =
          (indiceActual - 1 + this.pestanas.length) %
          this.pestanas.length;
        break;

      case 'Home':
        nuevoIndice = 0;
        break;

      case 'End':
        nuevoIndice = this.pestanas.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();

    this.seleccionarPestana(
      this.pestanas[nuevoIndice].id,
    );

    const boton =
      event.currentTarget as HTMLButtonElement;

    const botones =
      boton.parentElement
        ?.querySelectorAll<HTMLButtonElement>(
          '[role="tab"]',
        );

    botones?.[nuevoIndice]?.focus();
  }

  // ==========================================================
  // PRESENTACIÓN
  // ==========================================================
  duracion(
    segundos: number | null | undefined,
  ): string {
    if (
      segundos == null ||
      !Number.isFinite(segundos) ||
      segundos < 0
    ) {
      return 'Sin determinar';
    }

    const total = Math.floor(segundos);

    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const restantes = total % 60;

    return `${horas} h ${minutos} min ${restantes} s`;
  }

  obtenerEstado(estado: string): {
    label: string;
    class: string;
  } {
    const estados: Record<
      string,
      { label: string; class: string }
    > = {
      EN_CURSO: {
        label: 'En curso',
        class: 'badge-info',
      },
      PAUSADO: {
        label: 'Pausado',
        class: 'badge-warning',
      },
      FINALIZADO: {
        label: 'Finalizado',
        class: 'badge-success',
      },
      CANCELADO: {
        label: 'Cancelado',
        class: 'badge-error',
      },
      ATENDIDO: {
        label: 'Atendido',
        class: 'badge-success',
      },
      OMITIDO: {
        label: 'Omitido',
        class: 'badge-warning',
      },
      PENDIENTE: {
        label: 'Pendiente',
        class: 'badge-neutral',
      },
      ASIGNADO: {
        label: 'Asignado',
        class: 'badge-info',
      },
      ACEPTADO: {
        label: 'Aceptado',
        class: 'badge-success',
      },
      RECHAZADO: {
        label: 'Rechazado',
        class: 'badge-error',
      },
      RETIRADO: {
        label: 'Retirado',
        class: 'badge-neutral',
      },
    };

    return estados[estado] ?? {
      label: this.formatearTexto(estado),
      class: 'badge-neutral',
    };
  }

  obtenerEvento(tipo: string): string {
    const eventos: Record<string, string> = {
      INICIO: 'Recorrido iniciado',
      PAUSA: 'Recorrido pausado',
      REANUDACION: 'Recorrido reanudado',
      FINALIZACION: 'Recorrido finalizado',
      CANCELACION: 'Recorrido cancelado',
    };

    return eventos[tipo] ?? this.formatearTexto(tipo);
  }

  formatearTexto(
    valor: string | null | undefined,
  ): string {
    return valor
      ? valor.replace(/_/g, ' ')
      : 'No registrado';
  }

  // ==========================================================
  // ERRORES
  // ==========================================================
  private obtenerMensajeError(
    error: unknown,
    defecto: string,
  ): string {
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

      return (
        mensajeDe(objeto.details) ??
        mensajeDe(objeto.error) ??
        texto(objeto.message) ??
        defecto
      );
    }

    return defecto;
  }

  // ==========================================================
  // MODAL
  // ==========================================================
  cerrarModal(): void {
    this.cancelarConsultas();
    this.limpiarDatos();

    this.modalCerrado.emit();
    this.marcarCambios();
  }

  // ==========================================================
  // LIMPIEZA
  // ==========================================================
  private cancelarConsultas(): void {
    this.cargaSubscription?.unsubscribe();
    this.trazadoSubscription?.unsubscribe();

    this.cargaSubscription = undefined;
    this.trazadoSubscription = undefined;

    this.loading = false;
    this.loadingTrazado = false;
  }

  private limpiarDatos(): void {
    this.detalle = null;
    this.trazado = null;

    this.errorCarga = null;
    this.errorTrazado = null;

    this.trazadoConsultado = false;
    this.pestanaActiva = 'resumen';
  }

  private marcarCambios(): void {
    if (!this.destruido) {
      this.cdr.markForCheck();
    }
  }
}
