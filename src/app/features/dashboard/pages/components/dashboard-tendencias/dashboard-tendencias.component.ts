import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

// Service
import { DashboardService } from '../../../services/dashboard.service';

// Interfaces
import { DashboardTendencia, DashboardTendenciasData, DashboardTendenciasFilters } from '../../../interfaces';

type MetricaTendencia =
  | 'programaciones'
  | 'iniciadas'
  | 'finalizadas'
  | 'canceladas'
  | 'puntos_programados'
  | 'puntos_atendidos'
  | 'cumplimiento_porcentaje'
  | 'avance_recoleccion_porcentaje';

interface CantidadPorUnidad {
  unidad: string;
  cantidad: number;
}

interface TendenciaItem extends DashboardTendencia {
  cantidadesVista: CantidadPorUnidad[];
}

interface CampoPeriodo {
  clave: string;
  etiqueta: string;
  valor: string;
}

interface PuntoGrafica {
  periodo: string;
  valor: number;
  x: number;
  y: number;
}

@Component({
  selector: 'dashboard-tendencias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './dashboard-tendencias.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTendenciasComponent
  implements OnInit, OnChanges, OnDestroy {
  // ================================
  // Inputs
  // ================================
  @Input() filtros: DashboardTendenciasFilters = {};
  @Input() actualizacion = 0;

  // ================================
  // Datos
  // ================================
  dashboard: DashboardTendenciasData | null = null;
  tendencias: TendenciaItem[] = [];
  camposPeriodo: CampoPeriodo[] = [];

  isLoading = true;
  errorCarga: string | null = null;

  // ================================
  // Gráfica
  // ================================
  metricaSeleccionada: MetricaTendencia = 'programaciones';

  readonly metricas: {
    clave: MetricaTendencia;
    etiqueta: string;
    esPorcentaje: boolean;
  }[] = [
      {
        clave: 'programaciones',
        etiqueta: 'Programaciones',
        esPorcentaje: false,
      },
      {
        clave: 'iniciadas',
        etiqueta: 'Iniciadas',
        esPorcentaje: false,
      },
      {
        clave: 'finalizadas',
        etiqueta: 'Finalizadas',
        esPorcentaje: false,
      },
      {
        clave: 'canceladas',
        etiqueta: 'Canceladas',
        esPorcentaje: false,
      },
      {
        clave: 'puntos_programados',
        etiqueta: 'Puntos programados',
        esPorcentaje: false,
      },
      {
        clave: 'puntos_atendidos',
        etiqueta: 'Puntos atendidos',
        esPorcentaje: false,
      },
      {
        clave: 'cumplimiento_porcentaje',
        etiqueta: 'Cumplimiento',
        esPorcentaje: true,
      },
      {
        clave: 'avance_recoleccion_porcentaje',
        etiqueta: 'Avance de recolección',
        esPorcentaje: true,
      },
    ];

  tituloGrafica = 'Programaciones';
  esPorcentaje = false;

  puntosGrafica: PuntoGrafica[] = [];
  etiquetasGrafica: PuntoGrafica[] = [];
  lineaGrafica = '';

  marcasEjeY: {
    valor: number;
    y: number;
  }[] = [];

  private consulta?: Subscription;
  private inicializado = false;
  private destruido = false;

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.inicializado = true;
    this.getDashboardTendencias();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.inicializado &&
      (changes['filtros'] || changes['actualizacion'])
    ) {
      this.getDashboardTendencias();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consulta?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================
  getDashboardTendencias(): void {
    this.consulta?.unsubscribe();

    this.isLoading = true;
    this.errorCarga = null;
    this.limpiarDatos();
    this.cdr.markForCheck();

    const filtros: DashboardTendenciasFilters = {
      ...this.filtros,
    };

    this.consulta = this.dashboardService
      .getDashboardTendencias(filtros)
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
              'No se pudieron obtener las tendencias del dashboard.';
            return;
          }

          this.dashboard = response.data;

          // Se conserva el orden temporal enviado por el backend.
          this.tendencias = response.data.series.map((serie) => ({
            ...serie,
            cantidadesVista: this.extraerCantidades(
              serie.cantidades_por_unidad,
            ),
          }));

          this.camposPeriodo = this.extraerPeriodo(
            response.data.periodo,
          );

          this.prepararGrafica();
        },
        error: (error: unknown) => {
          this.errorCarga = this.obtenerMensajeError(error);
        },
      });
  }

  onMetricaChange(): void {
    // Cambia la gráfica sin repetir la consulta.
    this.prepararGrafica();
    this.cdr.markForCheck();
  }

  // ================================
  // Helpers methods
  // ================================
  private prepararGrafica(): void {
    const metrica = this.metricas.find(
      (item) => item.clave === this.metricaSeleccionada,
    );

    if (!metrica) {
      return;
    }

    this.tituloGrafica = metrica.etiqueta;
    this.esPorcentaje = metrica.esPorcentaje;

    this.puntosGrafica = [];
    this.etiquetasGrafica = [];
    this.marcasEjeY = [];
    this.lineaGrafica = '';

    if (this.tendencias.length === 0) {
      return;
    }

    const valores = this.tendencias
      .map((serie) => serie[this.metricaSeleccionada])
      .filter((valor) => Number.isFinite(valor));

    if (valores.length === 0) {
      return;
    }

    const maximoDato = valores.reduce(
      (maximo, valor) => Math.max(maximo, valor),
      0,
    );

    // Los porcentajes usan como mínimo una escala de 0 a 100.
    const maximo = this.esPorcentaje
      ? Math.max(100, maximoDato)
      : Math.max(1, Math.ceil(maximoDato));

    const izquierda = 55;
    const derecha = 780;
    const arriba = 20;
    const abajo = 215;

    const ancho = derecha - izquierda;
    const alto = abajo - arriba;
    const cantidad = this.tendencias.length;

    this.puntosGrafica = this.tendencias.flatMap(
      (serie, indice) => {
        const valor = serie[this.metricaSeleccionada];

        if (!Number.isFinite(valor)) {
          return [];
        }

        const x = cantidad === 1
          ? izquierda + ancho / 2
          : izquierda + (indice / (cantidad - 1)) * ancho;

        const y = abajo - (valor / maximo) * alto;

        return [{
          periodo: serie.periodo,
          valor,
          x,
          y,
        }];
      },
    );

    this.lineaGrafica = this.puntosGrafica
      .map((punto) => `${punto.x},${punto.y}`)
      .join(' ');

    this.marcasEjeY = [0, 0.5, 1].map((proporcion) => ({
      valor: maximo * proporcion,
      y: abajo - proporcion * alto,
    }));

    // Mostrar hasta seis etiquetas para evitar amontonarlas.
    const numeroEtiquetas = Math.min(
      6,
      this.puntosGrafica.length,
    );

    const indices = new Set<number>();

    for (let indice = 0; indice < numeroEtiquetas; indice++) {
      const posicion = numeroEtiquetas === 1
        ? 0
        : Math.round(
          indice *
          (this.puntosGrafica.length - 1) /
          (numeroEtiquetas - 1),
        );

      indices.add(posicion);
    }

    this.etiquetasGrafica = [...indices].map(
      (indice) => this.puntosGrafica[indice],
    );
  }

  private extraerCantidades(datos: unknown): CantidadPorUnidad[] {
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
    const texto = clave.replace(/_/g, ' ').toLowerCase();

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  private limpiarDatos(): void {
    this.dashboard = null;
    this.tendencias = [];
    this.camposPeriodo = [];

    this.puntosGrafica = [];
    this.etiquetasGrafica = [];
    this.marcasEjeY = [];
    this.lineaGrafica = '';
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
      : 'No se pudieron obtener las tendencias del dashboard.';
  }
}
