import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';

// Services
import { ReportesServices } from '../../../reportes/services/reportes.service';

// Interfaces
import { ReporteCiudadanosData, ReporteCiudadanosFilters, ReporteCiudadanoItem, ReporteEstadoIncidencia, ReporteOrigenCiudadano, ReportePrioridadIncidencia, ReporteTipoIncidencia } from '../../../reportes/interfaces';
import { IncidenciaId } from '../../../incidencias/interfaces';

// Componentes
import { IncidenciaViewComponent } from '../../../incidencias/pages/components/incidencia-view/incidencia-view.component';
import { ReporteImagenesComponent } from '../components/reporte-imagenes/reporte-imagenes.component';

// ==========================================================
// FECHA ACTUAL DE PERÚ
// ==========================================================
const fechaPeru = (): string => {
  const partes = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const valor = (tipo: string) =>
    partes.find(parte => parte.type === tipo)?.value ?? '';

  return `${valor('year')}-${valor('month')}-${valor('day')}`;
};

@Component({
  selector: 'app-reportes-ciudadanos-page',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    IncidenciaViewComponent,
    ReporteImagenesComponent,
  ],

  templateUrl: './reportes-ciudadanos-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesCiudadanosPageComponent implements OnInit, OnDestroy {

  // ==========================================================
  // DATOS
  // ==========================================================
  listado: ReporteCiudadanosData | null = null;
  reportes: ReporteCiudadanoItem[] = [];

  mostrarDetalle = false;
  idIncidenciaSeleccionada: IncidenciaId | null = null;

  idReporteImagenes: IncidenciaId | null = null;

  searchTimeout: any;
  isLoading = false;
  error = '';
  errorFiltros = '';

  // ==========================================================
  // FILTROS
  // ==========================================================
  fechaFinBusqueda = fechaPeru();
  fechaInicioBusqueda =
    `${this.fechaFinBusqueda.slice(0, 7)}-01`;

  estadoBusqueda: ReporteEstadoIncidencia | '' = '';
  tipoBusqueda: ReporteTipoIncidencia | '' = '';
  prioridadBusqueda: ReportePrioridadIncidencia | '' = '';
  origenBusqueda: ReporteOrigenCiudadano | '' = '';

  readonly estados: ReporteEstadoIncidencia[] = [
    'REPORTADA',
    'EN_REVISION',
    'EN_ATENCION',
    'RESUELTA',
    'RECHAZADA',
    'CANCELADA',
  ];

  readonly tipos: { value: ReporteTipoIncidencia, label: string }[] = [
    {
      value: "RECOLECCION_NO_REALIZADA",
      label: "RECOLECCION NO REALIZADA"
    },
    {
      value: "ACUMULACION_RESIDUOS",
      label: "ACUMULACION RESIDUOS"
    },
    {
      value: "VIA_BLOQUEADA",
      label: "VIA BLOQUEADA"
    },
    {
      value: "PUNTO_INACCESIBLE",
      label: "PUNTO INACCESIBLE"
    },
    {
      value: "AVERIA_VEHICULO",
      label: "AVERIA VEHICULO"
    },
    {
      value: "ACCIDENTE",
      label: "ACCIDENTE"
    },
    {
      value: "OTRO",
      label: "OTRO"
    },

  ];

  readonly prioridades: ReportePrioridadIncidencia[] = [
    'BAJA',
    'MEDIA',
    'ALTA',
    'CRITICA',
  ];

  // ==========================================================
  // PAGINACIÓN
  // ==========================================================
  page = 1;
  currentPage = 1;
  limit = 10;

  totalItems = 0;
  totalPages = 0;

  readonly pageSizeOptions = [5, 10, 20, 50];

  // Conserva los filtros consultados al cambiar de página.
  private filtrosAplicados: ReporteCiudadanosFilters = {
    fecha_inicio: this.fechaInicioBusqueda,
    fecha_fin: this.fechaFinBusqueda,
  };

  private consulta?: Subscription;
  private destruido = false;

  constructor(
    private readonly reportesService: ReportesServices,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // ==========================================================
  // CICLO DE VIDA
  // ==========================================================
  ngOnInit(): void {
    this.getReportesPaginated();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consulta?.unsubscribe();
  }

  // ==========================================================
  // CONSULTA
  // ==========================================================
  // buscar(): void {
  //   this.errorFiltros = this.validarFiltros();

  //   if (this.errorFiltros) {
  //     this.cdr.markForCheck();
  //     return;
  //   }

  //   const filtros: ReporteCiudadanosFilters = {
  //     fecha_inicio: this.fechaInicioBusqueda,
  //     fecha_fin: this.fechaFinBusqueda,
  //   };

  //   if (this.estadoBusqueda) {
  //     filtros.estado = this.estadoBusqueda;
  //   }

  //   if (this.tipoBusqueda) {
  //     filtros.tipo = this.tipoBusqueda;
  //   }

  //   if (this.prioridadBusqueda) {
  //     filtros.prioridad = this.prioridadBusqueda;
  //   }

  //   if (this.origenBusqueda) {
  //     filtros.origen = this.origenBusqueda;
  //   }

  //   this.filtrosAplicados = filtros;
  //   this.cargarPagina(1);
  // }

  getReportesPaginated(): void {

    // CONSTRUIR FILTROS TIPADOS
    const filtros: ReporteCiudadanosFilters = {
      ...this.filtrosAplicados,
      page: this.page,
      limit: this.limit,
    };

    if (this.tipoBusqueda) {
      filtros.tipo = this.tipoBusqueda;
    }

    // CONSULTAR LISTADO
    this.isLoading = true;
    this.marcarCambios();

    this.consulta = this.reportesService
      .getReporteCiudadanos(filtros)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.marcarCambios();
        }),
      )
      .subscribe({
        next: response => {
          if (!response.success || !response.data) {
            this.limpiarListado();
            this.error = response.message ||
              'No se pudieron consultar los reportes ciudadanos.';

            this.marcarCambios();

            return;
          }

          const data = response.data;

          this.listado = data;
          this.reportes = data.items;

          this.page = data.pagination.page;
          this.currentPage = data.pagination.page;
          this.limit = data.pagination.limit;

          this.totalItems = data.pagination.total;
          this.totalPages = data.pagination.total_pages;
        },

        error: (error: unknown) => {
          this.limpiarListado();

          this.error = this.obtenerMensajeError(
            error,
            'No se pudieron consultar los reportes ciudadanos.',
          );

          this.marcarCambios();
        },
      });

  }

  // ==========================================================
  // DETALLE
  // ==========================================================
  abrirDetalle(item: ReporteCiudadanoItem): void {
    this.idIncidenciaSeleccionada = item.id_incidencia;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.idIncidenciaSeleccionada = null;

    this.marcarCambios();
  }

  // ==========================================================
  // IMÁGENES
  // ==========================================================


  abrirImagenes(item: ReporteCiudadanoItem): void {
    this.idReporteImagenes = item.id_incidencia;
  }

  cerrarImagenes(): void {
    this.idReporteImagenes = null;

    this.marcarCambios();
  }

  // ==========================================================
  // PAGINACIÓN Y FILTROS
  // ==========================================================
  onFiltroChange(): void {
    // this.page = 1;
    // this.getRecorridosPaginated();

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getReportesPaginated();
    }, 300);
  }

  cambiarPagina(pagina: number): void {
    if (
      this.isLoading ||
      pagina < 1 ||
      pagina > this.totalPages ||
      pagina === this.page
    ) {
      return;
    }

    this.getReportesPaginated();
  }

  cambiarLimite(): void {
    this.limit = Number(this.limit);
    this.getReportesPaginated();
  }

  limpiarFiltros(): void {
    const hoy = fechaPeru();

    this.fechaInicioBusqueda = `${hoy.slice(0, 7)}-01`;
    this.fechaFinBusqueda = hoy;

    this.estadoBusqueda = '';
    this.tipoBusqueda = '';
    this.prioridadBusqueda = '';
    this.origenBusqueda = '';

    this.getReportesPaginated();
  }

  // ==========================================================
  // RESUMEN
  // Los conteos corresponden a todos los resultados filtrados,
  // no solamente a las filas de la página actual.
  // ==========================================================
  totalPorEstado(estado: ReporteEstadoIncidencia): number {
    return Number(
      this.listado?.resumen.por_estado.find(
        item => item.estado === estado,
      )?.total ?? 0,
    );
  }

  get pendientesRevision(): number {
    return this.totalPorEstado('REPORTADA') +
      this.totalPorEstado('EN_REVISION');
  }

  get registroDesde(): number {
    return this.totalItems === 0
      ? 0
      : (this.page - 1) * this.limit + 1;
  }

  get registroHasta(): number {
    return Math.min(
      this.page * this.limit,
      this.totalItems,
    );
  }

  // ==========================================================
  // PRESENTACIÓN
  // ==========================================================
  getEstadoBadge(estado: ReporteEstadoIncidencia): string {
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

  getPrioridadBadge(prioridad: ReportePrioridadIncidencia): string {
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

  getOrigenLabel(origen: ReporteOrigenCiudadano): string {
    return origen === 'APP_CIUDADANA'
      ? 'Aplicación ciudadana'
      : 'Web ciudadana';
  }

  formatearEtiqueta(valor: string): string {
    const texto = valor
      .replace(/_/g, ' ')
    // .toLocaleLowerCase('es-PE');

    return texto.charAt(0).toLocaleUpperCase('es-PE') +
      texto.slice(1);
  }

  // ==========================================================
  // VALIDACIONES
  // ==========================================================
  private validarFiltros(): string {
    const fechaValida = (valor: string): boolean => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return false;
      }

      const fecha = new Date(`${valor}T12:00:00Z`);

      return Number.isFinite(fecha.getTime()) &&
        fecha.toISOString().slice(0, 10) === valor;
    };

    if (
      !fechaValida(this.fechaInicioBusqueda) ||
      !fechaValida(this.fechaFinBusqueda)
    ) {
      return 'Selecciona una fecha inicial y final válidas.';
    }

    if (this.fechaInicioBusqueda > this.fechaFinBusqueda) {
      return 'La fecha inicial no puede ser posterior a la final.';
    }

    return '';
  }

  private limpiarListado(): void {
    this.listado = null;
    this.reportes = [];
    this.totalItems = 0;
    this.totalPages = 0;
  }

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

  private marcarCambios(): void {
    if (!this.destruido) {
      this.cdr.markForCheck();
    }
  }
}
