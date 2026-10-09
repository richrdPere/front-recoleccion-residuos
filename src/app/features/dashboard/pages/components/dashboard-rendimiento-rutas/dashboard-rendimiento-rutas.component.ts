import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

// Service
import { DashboardService } from '../../../services/dashboard.service';

// Interfaces
import { DashboardOrderDirection, DashboardRendimientoRuta, DashboardRendimientoRutasFilters, DashboardRendimientoRutasPeriodo } from '../../../interfaces';

interface CantidadPorUnidad {
  unidad: string;
  cantidad: number;
}

interface RendimientoRutaItem extends DashboardRendimientoRuta {
  cantidadesVista: CantidadPorUnidad[];
}

interface CampoPeriodo {
  clave: string;
  etiqueta: string;
  valor: string;
}

@Component({
  selector: 'dashboard-rendimiento-rutas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './dashboard-rendimiento-rutas.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardRendimientoRutasComponent
  implements OnInit, OnChanges, OnDestroy {
  // ================================
  // Inputs
  // ================================
  @Input() filtros: DashboardRendimientoRutasFilters = {};
  @Input() actualizacion = 0;

  // ================================
  // Datos
  // ================================
  rutas: RendimientoRutaItem[] = [];

  periodo: DashboardRendimientoRutasPeriodo | null = null;
  camposPeriodo: CampoPeriodo[] = [];

  isLoading = true;
  errorCarga: string | null = null;

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  // Ordenamiento
  readonly orderBy = 'cumplimiento_porcentaje';
  orderDirection: DashboardOrderDirection = 'DESC';

  private consulta?: Subscription;
  private inicializado = false;
  private destruido = false;

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.inicializado = true;
    this.aplicarConfiguracionFiltros();
    this.getDashboardRendimientoRutas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.inicializado) {
      return;
    }

    if (changes['filtros']) {
      this.aplicarConfiguracionFiltros();
      this.getDashboardRendimientoRutas();
      return;
    }

    // Actualizar conserva la página y el orden actuales.
    if (changes['actualizacion']) {
      this.getDashboardRendimientoRutas();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consulta?.unsubscribe();
  }

  // ================================
  // Methods
  // ================================
  getDashboardRendimientoRutas(): void {
    this.consulta?.unsubscribe();

    this.isLoading = true;
    this.errorCarga = null;
    this.limpiarDatos();
    this.cdr.markForCheck();

    const params: DashboardRendimientoRutasFilters = {
      ...this.filtros,
      page: this.page,
      limit: this.limit,
      order_by: this.orderBy,
      order_direction: this.orderDirection,
    };

    this.consulta = this.dashboardService
      .getDashboardRendimientoRutas(params)
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
              'No se pudo obtener el rendimiento de las rutas.';
            return;
          }

          const datos = response.data;

          this.periodo = datos.periodo;
          this.camposPeriodo = this.extraerPeriodo(datos.periodo);

          this.rutas = datos.items.map((ruta) => ({
            ...ruta,
            cantidadesVista: this.extraerCantidades(
              ruta.cantidades_por_unidad,
            ),
          }));

          // Se utiliza la paginación confirmada por el backend.
          this.page = datos.pagination.page;
          this.currentPage = datos.pagination.page;
          this.limit = datos.pagination.limit;
          this.totalItems = datos.pagination.total;
          this.totalPages = datos.pagination.total_pages;

          // Permite mostrar el límite si el backend lo ajustó.
          if (!this.pageSizeOptions.includes(this.limit)) {
            this.pageSizeOptions = [
              ...this.pageSizeOptions,
              this.limit,
            ].sort((a, b) => a - b);
          }
        },
        error: (error: unknown) => {
          this.errorCarga = this.obtenerMensajeError(error);
        },
      });
  }

  // ================================
  // Helpers methods
  // ================================
  cambiarPagina(nuevaPagina: number): void {
    if (
      this.isLoading ||
      nuevaPagina < 1 ||
      nuevaPagina > this.totalPages
    ) {
      return;
    }

    this.page = nuevaPagina;
    this.getDashboardRendimientoRutas();
  }

  cambiarLimite(): void {
    this.limit = this.numeroPositivo(Number(this.limit), 5);
    this.page = 1;
    this.getDashboardRendimientoRutas();
  }

  onOrdenChange(): void {
    if (
      this.orderDirection !== 'ASC' &&
      this.orderDirection !== 'DESC'
    ) {
      this.orderDirection = 'DESC';
    }

    this.page = 1;
    this.getDashboardRendimientoRutas();
  }

  porcentajeVisual(valor: number): number {
    return Number.isFinite(valor)
      ? Math.min(100, Math.max(0, valor))
      : 0;
  }

  private aplicarConfiguracionFiltros(): void {
    // Al cambiar los filtros vuelve a la primera página,
    // salvo que el padre indique una página explícita.
    this.page = this.numeroPositivo(this.filtros.page, 1);

    this.limit = this.numeroPositivo(
      this.filtros.limit,
      this.limit,
    );

    if (!this.pageSizeOptions.includes(this.limit)) {
      this.pageSizeOptions = [
        ...this.pageSizeOptions,
        this.limit,
      ].sort((a, b) => a - b);
    }

    const direccion = this.filtros.order_direction;

    if (direccion === 'ASC' || direccion === 'DESC') {
      this.orderDirection = direccion;
    }
  }

  private numeroPositivo(
    valor: number | null | undefined,
    fallback: number,
  ): number {
    return typeof valor === 'number' &&
      Number.isSafeInteger(valor) &&
      valor > 0
      ? valor
      : fallback;
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
    this.rutas = [];
    this.periodo = null;
    this.camposPeriodo = [];
    this.totalItems = 0;
    this.totalPages = 0;
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
      : 'No se pudo obtener el rendimiento de las rutas.';
  }
}
