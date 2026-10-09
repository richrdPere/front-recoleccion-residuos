import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { finalize, Subscription } from 'rxjs';

// Service
import { DashboardService } from '../../../services/dashboard.service';

// Interfaces
import { DashboardProgramacionesData, DashboardProgramacionesFilters } from '../../../interfaces';

interface IndicadorProgramacion {
  clave: string;
  etiqueta: string;
  valor: number;
  esPorcentaje: boolean;
}

interface EstadoProgramacion {
  clave: string;
  etiqueta: string;
  cantidad: number;
}

interface CampoPeriodo {
  clave: string;
  etiqueta: string;
  valor: string;
}

@Component({
  selector: 'dashboard-programaciones',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './dashboard-programaciones.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardProgramacionesComponent
  implements OnInit, OnChanges, OnDestroy {
  // ================================
  // Inputs
  // ================================
  @Input() filtros: DashboardProgramacionesFilters = {};
  @Input() actualizacion = 0;

  // ================================
  // Datos
  // ================================
  dashboard: DashboardProgramacionesData | null = null;

  indicadores: IndicadorProgramacion[] = [];
  estados: EstadoProgramacion[] = [];
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
    this.getDashboardProgramaciones();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.inicializado &&
      (changes['filtros'] || changes['actualizacion'])
    ) {
      this.getDashboardProgramaciones();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consulta?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================
  getDashboardProgramaciones(): void {
    // Evita que una respuesta anterior sustituya
    // los datos correspondientes a los filtros actuales.
    this.consulta?.unsubscribe();

    this.isLoading = true;
    this.errorCarga = null;
    this.limpiarDatos();
    this.cdr.markForCheck();

    const filtros: DashboardProgramacionesFilters = {
      ...this.filtros,
    };

    this.consulta = this.dashboardService
      .getDashboardProgramaciones(filtros)
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
              'No se pudieron obtener los indicadores de programaciones.';
            return;
          }

          this.dashboard = response.data;

          this.indicadores = this.extraerIndicadores(
            response.data.indicadores,
          );

          this.estados = this.extraerEstados(
            response.data.indicadores,
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
  private extraerIndicadores(
    datos: unknown,
  ): IndicadorProgramacion[] {
    if (!datos || typeof datos !== 'object') {
      return [];
    }

    return Object.entries(datos)
      .filter(
        (entrada): entrada is [string, number] =>
          typeof entrada[1] === 'number' &&
          Number.isFinite(entrada[1]),
      )
      .map(([clave, valor]) => ({
        clave,
        etiqueta: this.formatearEtiqueta(clave),
        valor,
        esPorcentaje: clave.includes('porcentaje'),
      }));
  }

  private extraerEstados(datos: unknown): EstadoProgramacion[] {
    if (!datos || typeof datos !== 'object') {
      return [];
    }

    const objeto = datos as Record<string, unknown>;
    const porEstado = objeto['por_estado'];

    if (!porEstado || typeof porEstado !== 'object') {
      return [];
    }

    return Object.entries(porEstado)
      .filter(
        (entrada): entrada is [string, number] =>
          typeof entrada[1] === 'number' &&
          Number.isFinite(entrada[1]),
      )
      .map(([clave, cantidad]) => ({
        clave,
        etiqueta: this.formatearEtiqueta(clave),
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
    this.indicadores = [];
    this.estados = [];
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
      : 'No se pudieron obtener los indicadores de programaciones.';
  }
}
