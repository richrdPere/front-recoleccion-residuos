import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize, timer } from 'rxjs';

// Services
import { ReportesServices } from '../../../reportes/services/reportes.service';

// Interfaces
import { ReporteEstadoRecorrido, ReporteRecorridoItem, ReporteRecorridosFilters } from '../../../reportes/interfaces';
import { PuntoRecorridoRecoleccion } from '../../interfaces';

// Componentes
import { RecoleccionPuntosComponent } from '../components/recoleccion-puntos/recoleccion-puntos.component';
// import { RecoleccionProgresoComponent } from '../components/recoleccion-progreso/recoleccion-progreso.component';
// import { RecoleccionCapacidadComponent } from '../components/recoleccion-capacidad/recoleccion-capacidad.component';
import { RecoleccionEvidenciaComponent } from '../components/recoleccion-evidencia/recoleccion-evidencia.component';
import { RecoleccionViewComponent } from '../components/recoleccion-view/recoleccion-view.component';
import { RecoleccionAnularComponent } from '../components/recoleccion-anular/recoleccion-anular.component';
import { RecoleccionResultadoRecorridoComponent } from '../components/recoleccion-resultado-recorrido/recoleccion-resultado-recorrido.component';

// ==========================================================
// FECHA DE PERÚ
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
  selector: 'app-recolecciones-page',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RecoleccionPuntosComponent,
    RecoleccionResultadoRecorridoComponent,
    RecoleccionEvidenciaComponent,
    RecoleccionViewComponent,
    RecoleccionAnularComponent,
  ],
  templateUrl: './recolecciones-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoleccionesPageComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);

  // ==========================================================
  // LISTADO
  // ==========================================================
  recorridos: ReporteRecorridoItem[] = [];

  isLoading = false;
  errorMensaje = '';
  errorFiltros = '';

  // ==========================================================
  // FILTROS
  // ==========================================================
  searchTimeout: any;

  fechaFinBusqueda = fechaPeru();
  fechaInicioBusqueda =
    `${this.fechaFinBusqueda.slice(0, 7)}-01`;

  estadoBusqueda: ReporteEstadoRecorrido | '' = '';

  readonly estados: { value: ReporteEstadoRecorrido; label: string; }[] = [
    {
      value: 'EN_CURSO',
      label: 'EN CURSO',
    },
    {
      value: 'PAUSADO',
      label: 'PAUSADO',
    },
    {
      value: 'FINALIZADO',
      label: 'FINALIZADO',
    },
    {
      value: 'CANCELADO',
      label: 'CANCELADO',
    },
  ];

  private filtrosAplicados: ReporteRecorridosFilters = {
    fecha_inicio: this.fechaInicioBusqueda,
    fecha_fin: this.fechaFinBusqueda,
  };

  // ==========================================================
  // PAGINACIÓN
  // ==========================================================
  page = 1;
  currentPage = 1;
  limit = 5;

  totalItems = 0;
  totalPages = 0;

  readonly pageSizeOptions = [5, 10, 20, 50];

  // ==========================================================
  // RECORRIDO SELECCIONADO
  // ==========================================================
  recorridoSeleccionado: ReporteRecorridoItem | null = null;
  recorrido_id: number | null = null;

  actualizacionRecolecciones = 0;

  // ==========================================================
  // EVIDENCIAS
  // ==========================================================
  recoleccion_id: number | null = null;
  actualizacionEvidencias = 0;

  // ==========================================================
  // MODAL DE DETALLE
  // ==========================================================
  mostrarModalView = false;
  recoleccionViewId: number | null = null;
  actualizacionDetalle = 0;

  // ==========================================================
  // MODAL DE ANULACIÓN
  // ==========================================================
  mostrarModalAnular = false;
  recoleccionAnularId: number | null = null;

  // Suscripciones
  private consultaListado?: Subscription;
  private refrescoAutomatico?: Subscription;
  private destruido = false;

  constructor(
    private readonly reportesService: ReportesServices,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // ==========================================================
  // CICLO DE VIDA
  // ==========================================================
  ngOnInit(): void {
    this.getRecoleccionesPaginated();

    this.refrescoAutomatico = timer(
      30_000,
      30_000,
    ).subscribe(() => {
      if (
        this.document.visibilityState !== 'visible' ||
        this.recorrido_id === null ||
        this.mostrarModalView ||
        this.mostrarModalAnular
      ) {
        return;
      }

      this.actualizarRecolecciones();
    });
  }

  ngOnDestroy(): void {
    this.destruido = true;

    this.consultaListado?.unsubscribe();
    this.refrescoAutomatico?.unsubscribe();
  }

  // ==========================================================
  // CONSULTAR LISTADO
  // ==========================================================
  // buscar(): void {
  //   this.errorFiltros = this.validarFiltros();

  //   if (this.errorFiltros) {
  //     this.cdr.markForCheck();
  //     return;
  //   }

  //   this.filtrosAplicados = {
  //     fecha_inicio: this.fechaInicioBusqueda,
  //     fecha_fin: this.fechaFinBusqueda,
  //   };

  //   if (this.estadoBusqueda) {
  //     this.filtrosAplicados.estado = this.estadoBusqueda;
  //   }

  //   this.cargarPagina(1);
  // }

  getRecoleccionesPaginated(): void {

    // CONSTRUIR FILTROS TIPADOS
    this.filtrosAplicados = {
      fecha_inicio: this.fechaInicioBusqueda,
      fecha_fin: this.fechaFinBusqueda,
    };

    if (this.estadoBusqueda) {
      this.filtrosAplicados.estado = this.estadoBusqueda;
    }

    // CONSULTAR LISTADO
    this.consultaListado = this.reportesService
      .getReporteRecorridos({
        ...this.filtrosAplicados,
        page: this.page,
        limit: this.limit,
      })
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
              'No se pudieron consultar los recorridos.';
            return;
          }

          const data = response.data;

          this.recorridos = data.items;

          this.page = data.pagination.page;
          this.currentPage = data.pagination.page;
          this.limit = data.pagination.limit;

          this.totalItems = data.pagination.total;
          this.totalPages = data.pagination.total_pages;
        },

        error: (error: unknown) => {
          this.errorMensaje = this.obtenerMensajeError(
            error,
            'No se pudieron consultar los recorridos.',
          );
        },
      });
  }

  // ==========================================================
  // FILTROS Y PAGINACIÓN
  // ==========================================================
  onFiltroChange(): void {
    // this.page = 1;
    // this.getRecorridosPaginated();

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getRecoleccionesPaginated();
    }, 300);
  }

  limpiarFiltros(): void {
    const hoy = fechaPeru();

    this.fechaInicioBusqueda = `${hoy.slice(0, 7)}-01`;
    this.fechaFinBusqueda = hoy;
    this.estadoBusqueda = '';

    this.getRecoleccionesPaginated();
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
    this.page = pagina;
    this.getRecoleccionesPaginated();
  }

  cambiarLimite(): void {
    this.limit = Number(this.limit);
    this.page = 1;

    this.getRecoleccionesPaginated();
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
  // SELECCIÓN DEL RECORRIDO
  // ==========================================================
  seleccionarRecorrido(recorrido: ReporteRecorridoItem): void {
    if (!this.esIdentificadorValido(recorrido.id_recorrido)) {
      return;
    }

    this.limpiarSeleccionRecoleccion();

    this.recorridoSeleccionado = recorrido;
    this.recorrido_id = recorrido.id_recorrido;

    // También permite volver a consultar si se selecciona
    // nuevamente el mismo recorrido.
    this.actualizacionRecolecciones++;

    this.cdr.markForCheck();
  }

  volverAlListado(): void {
    this.limpiarSeleccionRecoleccion();

    this.recorridoSeleccionado = null;
    this.recorrido_id = null;

    // Actualiza los conteos después de consultar o anular registros.
    this.getRecoleccionesPaginated();
  }

  actualizarRecolecciones(): void {
    if (this.recorrido_id === null) return;

    this.actualizacionRecolecciones++;
    this.actualizacionEvidencias++;
    this.actualizacionDetalle++;

    this.cdr.markForCheck();
  }

  // ==========================================================
  // EVIDENCIAS
  // ==========================================================
  abrirEvidenciasRecoleccion(idRecoleccion: number): void {
    if (
      this.recorrido_id === null ||
      !this.esIdentificadorValido(idRecoleccion)
    ) {
      return;
    }

    this.cerrarModalView();

    if (this.recoleccion_id === idRecoleccion) {
      this.actualizacionEvidencias++;
    } else {
      this.recoleccion_id = idRecoleccion;
    }

    this.cdr.markForCheck();
  }

  cerrarEvidencias(): void {
    this.recoleccion_id = null;
    this.cdr.markForCheck();
  }

  onEvidenciasActualizadas(idRecoleccion: number): void {
    if (
      this.mostrarModalView &&
      this.recoleccionViewId === idRecoleccion
    ) {
      this.actualizacionDetalle++;
    }

    this.cdr.markForCheck();
  }

  // ==========================================================
  // DETALLE DE UNA RECOLECCIÓN
  // ==========================================================
  abrirDetalleRecoleccion(idRecoleccion: number): void {
    if (
      this.recorrido_id === null ||
      !this.esIdentificadorValido(idRecoleccion)
    ) {
      return;
    }

    this.cerrarModalAnular();

    this.recoleccionViewId = idRecoleccion;
    this.mostrarModalView = true;

    this.cdr.markForCheck();
  }

  cerrarModalView(): void {
    this.mostrarModalView = false;
    this.recoleccionViewId = null;

    this.cdr.markForCheck();
  }

  // ==========================================================
  // ANULACIÓN
  // ==========================================================
  abrirModalAnular(
    recoleccion: PuntoRecorridoRecoleccion,
  ): void {
    if (
      recoleccion.id_recorrido !== this.recorrido_id ||
      !this.esIdentificadorValido(recoleccion.id_recoleccion) ||
      recoleccion.fecha_anulacion !== null
    ) {
      return;
    }

    this.cerrarModalView();

    this.recoleccionAnularId = recoleccion.id_recoleccion;
    this.mostrarModalAnular = true;

    this.cdr.markForCheck();
  }

  cerrarModalAnular(): void {
    this.mostrarModalAnular = false;
    this.recoleccionAnularId = null;

    this.cdr.markForCheck();
  }

  onRecoleccionAnulada(
    recoleccion: PuntoRecorridoRecoleccion,
  ): void {
    if (recoleccion.id_recorrido !== this.recorrido_id) {
      return;
    }

    if (
      this.recoleccionAnularId === recoleccion.id_recoleccion
    ) {
      this.cerrarModalAnular();
    }

    this.actualizarRecolecciones();
  }

  // ==========================================================
  // PRESENTACIÓN
  // ==========================================================
  getEstadoBadge(estado: ReporteEstadoRecorrido): string {
    switch (estado) {
      case 'EN_CURSO':
        return 'badge-success';

      case 'PAUSADO':
        return 'badge-warning';

      case 'FINALIZADO':
        return 'badge-info';

      case 'CANCELADO':
        return 'badge-error';

      default:
        return 'badge-neutral';
    }
  }

  obtenerEstado(estado: string): {
    label: string;
    class: string;
  } {
    const estados: Record<
      string,
      { label: string; class: string }
    > = {
      FINALIZADO: {
        label: 'Finalizado',
        class: 'badge-success',
      },
      CANCELADO: {
        label: 'Cancelado',
        class: 'badge-error',
      },
      EN_CURSO: {
        label: 'En curso',
        class: 'badge-info',
      },
      PAUSADO: {
        label: 'Pausado',
        class: 'badge-warning',
      },
    };

    return estados[estado] ?? {
      label: estado,
      class: 'badge-neutral',
    };
  }


  // getEstadoLabel(estado: string): string {
  //   const etiquetas: Record<ReporteEstadoRecorrido, string> = {
  //     EN_CURSO: 'En curso',
  //     PAUSADO: 'Pausado',
  //     FINALIZADO: 'Finalizado',
  //     CANCELADO: 'Cancelado',
  //   };

  //   return etiquetas[estado] ?? estado;
  // }

  // ==========================================================
  // HELPERS
  // ==========================================================
  private limpiarSeleccionRecoleccion(): void {
    this.recoleccion_id = null;

    this.mostrarModalView = false;
    this.recoleccionViewId = null;

    this.mostrarModalAnular = false;
    this.recoleccionAnularId = null;
  }

  private esIdentificadorValido(
    id: number | null,
  ): id is number {
    return typeof id === 'number' &&
      Number.isSafeInteger(id) &&
      id > 0;
  }

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
      return 'Selecciona fechas válidas para consultar.';
    }

    if (this.fechaInicioBusqueda > this.fechaFinBusqueda) {
      return 'La fecha inicial no puede ser posterior a la final.';
    }

    return '';
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
}
