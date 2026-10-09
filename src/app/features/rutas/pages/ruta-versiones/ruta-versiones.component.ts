import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, Subscription } from 'rxjs';

// Service
import { RutaVersionService } from '../../services/ruta-version.service';

// Interfaces
import { RutaPuntoData, RutaVersionConPuntosData, } from '../../interfaces/rutas';
import { RutaVersionFormComponent } from './ruta-version-form/ruta-version-form.component';
import { RutaPuntoComponent } from '../ruta-punto/ruta-punto.component';

@Component({
  selector: 'ruta-versiones',
  standalone: true,
  imports: [CommonModule, RutaVersionFormComponent, RutaPuntoComponent],
  templateUrl: './ruta-versiones.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutaVersionesComponent
  implements OnChanges, OnDestroy {

  // *********************************************************
  // INPUTS / OUTPUTS
  // *********************************************************
  @Input() mostrarModal = false;
  @Input() ruta_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() gestionarPuntos = new EventEmitter<RutaVersionConPuntosData>();

  // *********************************************************
  // DEPENDENCIAS
  // *********************************************************
  private readonly rutaVersionService = inject(RutaVersionService);
  private consulta?: Subscription;

  // *********************************************************
  // ESTADO
  // *********************************************************
  mostrarModalVersionForm = false;

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly versiones =
    signal<RutaVersionConPuntosData[]>([]);

  readonly indiceSeleccionado = signal<number | null>(null);

  readonly versionSeleccionada =
    computed<RutaVersionConPuntosData | null>(() => {
      const indice = this.indiceSeleccionado();

      return indice === null
        ? null
        : this.versiones()[indice] ?? null;
    });

  readonly puntosOrdenados = computed<RutaPuntoData[]>(() =>
    [...(this.versionSeleccionada()?.puntos ?? [])].sort(
      (a, b) =>
        a.orden - b.orden ||
        a.id_ruta_punto - b.id_ruta_punto,
    ),
  );

  // *********************************************************
  // CICLO DE VIDA
  // *********************************************************
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['mostrarModal'] && !changes['ruta_id']) {
      return;
    }

    if (!this.mostrarModal) {
      this.limpiar();
      return;
    }

    this.cargarVersiones();
  }

  ngOnDestroy(): void {
    this.consulta?.unsubscribe();
  }

  // *********************************************************
  // 1. OBTENER VERSIONES
  // *********************************************************
  cargarVersiones(): void {
    // Cancelar primero evita que una respuesta anterior
    // reemplace los datos de otra ruta.
    this.consulta?.unsubscribe();

    this.versiones.set([]);
    this.indiceSeleccionado.set(null);
    this.error.set(null);

    const idRuta = this.ruta_id;

    if (
      idRuta === null ||
      !Number.isSafeInteger(idRuta) ||
      idRuta <= 0
    ) {
      this.cargando.set(false);
      this.error.set('El identificador de la ruta no es válido.');
      return;
    }

    this.cargando.set(true);

    this.consulta = this.rutaVersionService
      .getVersionesByRuta(idRuta)
      .pipe(
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.error.set(
              response.message ||
              'No se pudieron obtener las versiones.',
            );
            return;
          }

          const versiones = response.data ?? [];

          this.versiones.set(versiones);
          this.indiceSeleccionado.set(
            versiones.length > 0 ? 0 : null,
          );
        },
        error: (error: unknown) => {
          this.error.set(this.obtenerMensajeError(error));
        },
      });
  }

  // *********************************************************
  // 2. SELECCIONAR VERSIÓN
  // *********************************************************
  seleccionarVersion(indice: number): void {
    if (!this.versiones()[indice]) {
      return;
    }

    this.indiceSeleccionado.set(indice);
  }

  abrirEditarPunto($event: RutaPuntoData) {
    throw new Error('Method not implemented.');
  }
  abrirCrearPunto($event: number) {
    throw new Error('Method not implemented.');
  }

  // *********************************************************
  // 3. ABRIR GESTIÓN DE PUNTOS
  // *********************************************************
  abrirGestionPuntos(): void {
    const version = this.versionSeleccionada();

    if (version) {
      this.gestionarPuntos.emit(version);
    }
  }

  abrirVersionForm(): void {
    if (this.ruta_id === null || this.ruta_id <= 0) {
      return;
    }

    this.mostrarModalVersionForm = true;
  }

  cerrarVersionForm(): void {
    this.mostrarModalVersionForm = false;
  }

  onVersionCreada(): void {
    this.mostrarModalVersionForm = false;
    this.cargarVersiones();
  }

  // *********************************************************
  // 4. CERRAR
  // *********************************************************
  cerrarModal(): void {
    this.limpiar();
    this.modalCerrado.emit();
  }

  // *********************************************************
  // MÉTODOS PRIVADOS
  // *********************************************************
  private limpiar(): void {
    this.consulta?.unsubscribe();
    this.consulta = undefined;

    this.cargando.set(false);
    this.error.set(null);
    this.versiones.set([]);
    this.indiceSeleccionado.set(null);
  }

  private obtenerMensajeError(error: unknown): string {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    if (error && typeof error === 'object') {
      const objeto = error as {
        message?: unknown;
        error?: {
          message?: unknown;
        } | string;
      };

      const mensajeBackend =
        typeof objeto.error === 'string'
          ? objeto.error
          : objeto.error?.message;

      if (
        typeof mensajeBackend === 'string' &&
        mensajeBackend.trim()
      ) {
        return mensajeBackend;
      }

      if (
        typeof objeto.message === 'string' &&
        objeto.message.trim()
      ) {
        return objeto.message;
      }
    }

    return 'No se pudieron obtener las versiones de la ruta.';
  }
}
