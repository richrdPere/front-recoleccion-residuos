import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { finalize, Subscription } from 'rxjs';

// Service
import { DashboardService } from '../../../services/dashboard.service';

// Interfaces
import { DashboardVehiculosData, DashboardVehiculosFilters } from '../../../interfaces';

interface EstadoVehiculo {
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
  selector: 'dashboard-vehiculos',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './dashboard-vehiculos.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardVehiculosComponent
  implements OnInit, OnChanges, OnDestroy {
  // ================================
  // Inputs
  // ================================
  @Input() filtros: DashboardVehiculosFilters = {};
  @Input() actualizacion = 0;

  // ================================
  // Datos
  // ================================
  dashboard: DashboardVehiculosData | null = null;

  estadosVehiculos: EstadoVehiculo[] = [];
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
    this.getDashboardVehiculos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.inicializado &&
      (changes['filtros'] || changes['actualizacion'])
    ) {
      this.getDashboardVehiculos();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consulta?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================
  getDashboardVehiculos(): void {
    this.consulta?.unsubscribe();

    this.isLoading = true;
    this.errorCarga = null;
    this.limpiarDatos();
    this.cdr.markForCheck();

    const filtros: DashboardVehiculosFilters = {
      ...this.filtros,
    };

    this.consulta = this.dashboardService
      .getDashboardVehiculos(filtros)
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
              'No se pudieron obtener los indicadores de vehículos.';
            return;
          }

          this.dashboard = response.data;

          this.estadosVehiculos = this.extraerEstados(
            response.data.indicadores.por_estado,
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
  private extraerEstados(datos: unknown): EstadoVehiculo[] {
    if (!datos || typeof datos !== 'object') {
      return [];
    }

    return Object.entries(datos)
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
    this.estadosVehiculos = [];
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
      : 'No se pudieron obtener los indicadores de vehículos.';
  }
}
