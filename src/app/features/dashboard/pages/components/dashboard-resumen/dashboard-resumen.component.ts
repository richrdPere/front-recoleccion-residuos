import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { finalize, Subscription } from 'rxjs';

// Service
import { DashboardService } from '../../../services/dashboard.service';

// Interfaces
import { DashboardResumenData, DashboardResumenFilters } from '../../../interfaces';

interface IndicadorResumen {
  clave: string;
  etiqueta: string;
  valor: number;
}

interface CampoPeriodo {
  clave: string;
  etiqueta: string;
  valor: string;
}

@Component({
  selector: 'dashboard-resumen',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
  ],
  templateUrl: './dashboard-resumen.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardResumenComponent
  implements OnInit, OnChanges, OnDestroy {
  // ================================
  // Inputs
  // ================================
  @Input() filtros: DashboardResumenFilters = {};

  // El padre incrementa este valor para actualizar
  // aunque los filtros no hayan cambiado.
  @Input() actualizacion = 0;

  // ================================
  // Datos
  // ================================
  resumen: DashboardResumenData | null = null;

  isLoading = true;
  errorCarga: string | null = null;

  indicadoresProgramaciones: IndicadorResumen[] = [];
  indicadoresRecorridos: IndicadorResumen[] = [];

  estadosProgramaciones: IndicadorResumen[] = [];
  estadosRecorridos: IndicadorResumen[] = [];
  estadosVehiculos: IndicadorResumen[] = [];

  cantidadesPorUnidad: IndicadorResumen[] = [];
  camposPeriodo: CampoPeriodo[] = [];

  private consulta?: Subscription;
  private inicializado = false;

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.inicializado = true;
    this.getDashboardResumen();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.inicializado &&
      (changes['filtros'] || changes['actualizacion'])
    ) {
      this.getDashboardResumen();
    }
  }

  ngOnDestroy(): void {
    this.consulta?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================
  getDashboardResumen(): void {
    // Cancela la consulta anterior si cambian los filtros.
    this.consulta?.unsubscribe();

    this.isLoading = true;
    this.errorCarga = null;
    this.limpiarDatos();
    this.cdr.markForCheck();

    const filtros: DashboardResumenFilters = {
      ...this.filtros,
    };

    this.consulta = this.dashboardService
      .getDashboardResumen(filtros)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorCarga =
              response.message ||
              'No se pudo obtener el resumen del dashboard.';
            return;
          }

          this.resumen = response.data;

          this.indicadoresProgramaciones = this.extraerIndicadores(this.resumen.programaciones);

          this.indicadoresRecorridos = this.extraerIndicadores(this.resumen.recorridos);

          this.estadosProgramaciones = this.extraerEstados(this.resumen.programaciones);

          this.estadosRecorridos = this.extraerEstados(this.resumen.recorridos);

          this.estadosVehiculos = this.extraerIndicadores(this.resumen.vehiculos.por_estado);

          this.cantidadesPorUnidad = this.extraerIndicadores(this.resumen.recolecciones.cantidades_por_unidad);

          this.camposPeriodo = this.extraerPeriodo(this.resumen.periodo);
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
      this.resumen?.recolecciones.avance_porcentaje ?? 0;

    // Limita solo el ancho visual de la barra.
    return Number.isFinite(avance)
      ? Math.min(100, Math.max(0, avance))
      : 0;
  }

  esPorcentaje(clave: string): boolean {
    return clave.includes('porcentaje');
  }

  private extraerIndicadores(
    datos: unknown,
  ): IndicadorResumen[] {
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
      }));
  }

  private extraerEstados(datos: unknown): IndicadorResumen[] {
    if (!datos || typeof datos !== 'object') {
      return [];
    }

    const objeto = datos as Record<string, unknown>;

    return this.extraerIndicadores(objeto['por_estado']);
  }

  private extraerPeriodo(datos: unknown): CampoPeriodo[] {
    if (!datos || typeof datos !== 'object') {
      return [];
    }

    return Object.entries(datos)
      .filter(
        ([, valor]) =>
          typeof valor === 'string' ||
          typeof valor === 'number',
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
    this.resumen = null;

    this.indicadoresProgramaciones = [];
    this.indicadoresRecorridos = [];

    this.estadosProgramaciones = [];
    this.estadosRecorridos = [];
    this.estadosVehiculos = [];

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
      : 'No se pudo obtener el resumen del dashboard.';
  }
}
