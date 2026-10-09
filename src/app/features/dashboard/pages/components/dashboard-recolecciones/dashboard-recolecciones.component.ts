import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { finalize, Subscription } from 'rxjs';

// Service
import { DashboardService } from '../../../services/dashboard.service';

// Interfaces
import { DashboardRecoleccionesData, DashboardRecoleccionesFilters } from '../../../interfaces';

interface CantidadPorUnidad {
  unidad: string;
  cantidad: number;
}

interface CampoPeriodo {
  clave: string;
  etiqueta: string;
  valor: string;
}

@Component({
  selector: 'dashboard-recolecciones',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './dashboard-recolecciones.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardRecoleccionesComponent
  implements OnInit, OnChanges, OnDestroy {
  // ================================
  // Inputs
  // ================================
  @Input() filtros: DashboardRecoleccionesFilters = {};
  @Input() actualizacion = 0;

  // ================================
  // Datos
  // ================================
  dashboard: DashboardRecoleccionesData | null = null;

  cantidadesPorUnidad: CantidadPorUnidad[] = [];
  camposPeriodo: CampoPeriodo[] = [];

  isLoading = true;
  errorCarga: string | null = null;

  private consulta?: Subscription;
  private inicializado = false;
  private destruido = false;

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.inicializado = true;
    this.getDashboardRecolecciones();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.inicializado &&
      (changes['filtros'] || changes['actualizacion'])
    ) {
      this.getDashboardRecolecciones();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consulta?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================
  getDashboardRecolecciones(): void {
    // Cancela la consulta anterior al cambiar los filtros.
    this.consulta?.unsubscribe();

    this.isLoading = true;
    this.errorCarga = null;
    this.limpiarDatos();
    this.cdr.markForCheck();

    const filtros: DashboardRecoleccionesFilters = {
      ...this.filtros,
    };

    this.consulta = this.dashboardService
      .getDashboardRecolecciones(filtros)
      .pipe(
        finalize(() => {
          this.isLoading = false;

          if (!this.destruido) {
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorCarga =
              response.message ||
              'No se pudieron obtener los indicadores de recolecciones.';
            return;
          }

          this.dashboard = response.data;

          this.cantidadesPorUnidad = this.extraerCantidades(
            response.data.indicadores.cantidades_por_unidad,
          );

          this.camposPeriodo = this.extraerPeriodo(
            response.data.periodo,
          );
        },
        error: (error: unknown) => {
          this.errorCarga = this.obtenerMensajeError(error);
        },
      });
  }

  // ================================
  // Helpers methods
  // ================================
  get avanceVisual(): number {
    const avance =
      this.dashboard?.indicadores.avance_porcentaje ?? 0;

    // Se limita únicamente el valor visual de la barra.
    return Number.isFinite(avance)
      ? Math.min(100, Math.max(0, avance))
      : 0;
  }

  private extraerCantidades(
    datos: unknown,
  ): CantidadPorUnidad[] {
    if (!datos || typeof datos !== 'object') {
      return [];
    }

    return Object.entries(datos)
      .filter(
        (entrada): entrada is [string, number] =>
          typeof entrada[1] === 'number' &&
          Number.isFinite(entrada[1]),
      )
      .map(([unidad, cantidad]) => ({
        unidad,
        cantidad,
      }));
  }

  private extraerPeriodo(datos: unknown): CampoPeriodo[] {
    if (!datos || typeof datos !== 'object') {
      return [];
    }

    // Estos campos se muestran por separado en el HTML.
    const camposSeparados = new Set([
      'id_zona',
      'id_ruta',
      'id_vehiculo',
      'agrupacion',
    ]);

    return Object.entries(datos)
      .filter(
        ([clave, valor]) =>
          !camposSeparados.has(clave) &&
          (
            typeof valor === 'string' ||
            typeof valor === 'number'
          ),
      )
      .map(([clave, valor]) => ({
        clave,
        etiqueta: this.formatearEtiqueta(clave),
        valor: String(valor),
      }));
  }

  private formatearEtiqueta(clave: string): string {
    const texto = clave
      .replace(/_/g, ' ')
      .toLowerCase();

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  private limpiarDatos(): void {
    this.dashboard = null;
    this.cantidadesPorUnidad = [];
    this.camposPeriodo = [];
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
      : 'No se pudieron obtener los indicadores de recolecciones.';
  }
}
