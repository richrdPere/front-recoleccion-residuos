import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, finalize, map, takeUntil } from 'rxjs';

// Service
import { AuditoriaService } from '../../services/auditoria.service';

// Interfaces
import { AuditoriaDetalleData, AuditoriaEntidadData, AuditoriaEntidadFilters, AuditoriaId, AuditoriaPaginadoData, AuditoriaPaginadoFilters } from '../../interfaces';

// Componentes
import { AuditoriaFiltrosComponent } from '../components/auditoria-filtros/auditoria-filtros.component';
import { AuditoriaTablaComponent } from '../components/auditoria-tabla/auditoria-tabla.component';
import { AuditoriaDetalleComponent } from '../components/auditoria-detalle/auditoria-detalle.component';
import { AuditoriaEntidadComponent, AuditoriaEntidadSeleccionada } from '../components/auditoria-entidad/auditoria-entidad.component';

@Component({
  selector: 'app-auditoria-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AuditoriaFiltrosComponent,
    AuditoriaTablaComponent,
    AuditoriaDetalleComponent,
    AuditoriaEntidadComponent,
  ],
  templateUrl: './auditoria-page.component.html',
})
export class AuditoriaPageComponent implements OnInit, OnDestroy {

  // *********************************************************
  // LISTADO PRINCIPAL
  // *********************************************************

  filtros: AuditoriaPaginadoFilters = {
    ...this.obtenerPeriodoActual(),
    page: 1,
    limit: 20,
    sort_order: 'DESC',
  };

  filtrosAplicados: AuditoriaPaginadoFilters | null = null;
  filtrosModificados = false;

  datos: AuditoriaPaginadoData | null = null;
  isLoading = false;
  errorConsulta = '';

  readonly pageSizeOptions = [10, 20, 50, 100];

  // *********************************************************
  // DETALLE
  // *********************************************************

  detalleAbierto = false;
  detalle: AuditoriaDetalleData | null = null;
  cargandoDetalle = false;
  errorDetalle = '';

  private idDetalle: AuditoriaId | null = null;

  // *********************************************************
  // HISTORIAL DE ENTIDAD
  // *********************************************************

  entidadAbierta = false;

  entidadSeleccionada: AuditoriaEntidadSeleccionada | null = null;

  filtrosEntidad: AuditoriaEntidadFilters = {
    ...this.obtenerPeriodoActual(),
    page: 1,
    limit: 20,
    sort_order: 'DESC',
  };

  filtrosEntidadAplicados: AuditoriaEntidadFilters | null = null;
  filtrosEntidadModificados = false;

  historialEntidad: AuditoriaEntidadData | null = null;
  cargandoEntidad = false;
  errorEntidad = '';

  // *********************************************************
  // SUSCRIPCIONES
  // *********************************************************

  private listadoSub?: Subscription;
  private detalleSub?: Subscription;
  private entidadSub?: Subscription;

  private readonly destroy$ = new Subject<void>();
  private destruido = false;

  constructor(
    private readonly auditoriaService: AuditoriaService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // *********************************************************
  // CICLO DE VIDA
  // *********************************************************

  ngOnInit(): void {
    this.consultarAuditoria(this.filtros);
  }

  ngOnDestroy(): void {
    this.destruido = true;

    this.destroy$.next();
    this.destroy$.complete();

    this.listadoSub?.unsubscribe();
    this.detalleSub?.unsubscribe();
    this.entidadSub?.unsubscribe();
  }

  private actualizarVista(): void {
    if (!this.destruido) {
      this.cdr.markForCheck();
    }
  }

  // *********************************************************
  // PAGINACIÓN PRINCIPAL
  // *********************************************************

  get paginaActual(): number {
    return this.datos?.pagination.page ?? 1;
  }

  get limiteActual(): number {
    return this.datos?.pagination.limit ??
      this.filtros.limit ??
      20;
  }

  get totalItems(): number {
    return this.datos?.pagination.total ?? 0;
  }

  get totalPages(): number {
    return this.datos?.pagination.total_pages ?? 0;
  }

  get desde(): number {
    return this.totalItems
      ? (this.paginaActual - 1) * this.limiteActual + 1
      : 0;
  }

  get hasta(): number {
    return Math.min(
      this.paginaActual * this.limiteActual,
      this.totalItems,
    );
  }

  // *********************************************************
  // FILTROS PRINCIPALES
  // *********************************************************

  actualizarFiltros(filtros: AuditoriaPaginadoFilters): void {
    if (this.isLoading) return;

    this.filtros = { ...filtros };
    this.filtrosModificados = true;
    this.errorConsulta = '';
  }

  limpiarFiltros(): void {
    if (this.isLoading) return;

    this.filtros = {
      ...this.obtenerPeriodoActual(),
      page: 1,
      limit: this.limiteActual,
      sort_order: 'DESC',
    };

    this.filtrosModificados = true;
    this.consultarAuditoria(this.filtros);
  }

  consultarAuditoria(filtros: AuditoriaPaginadoFilters): void {
    if (this.isLoading) return;

    const consulta: AuditoriaPaginadoFilters = {
      ...filtros,
      page: 1,
      limit: filtros.limit ?? 20,
      sort_order: filtros.sort_order ?? 'DESC',
    };

    try {
      this.validarPeriodo(consulta);
    } catch (error) {
      this.errorConsulta = this.mensajeError(error);
      return;
    }

    this.filtros = { ...consulta };
    this.cargarListado(consulta);
  }

  // *********************************************************
  // CONSULTA PRINCIPAL
  // *********************************************************

  private cargarListado(consulta: AuditoriaPaginadoFilters): void {
    this.listadoSub?.unsubscribe();

    this.isLoading = true;
    this.errorConsulta = '';

    this.listadoSub = this.auditoriaService
      .getAuditoriaPaginado(consulta)
      .pipe(
        map(respuesta => {
          if (!respuesta.success || !respuesta.data) {
            throw new Error(
              respuesta.message ||
              'No se pudo obtener la auditoría.',
            );
          }

          return respuesta.data;
        }),
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.actualizarVista();
        }),
      )
      .subscribe({
        next: datos => {
          this.datos = datos;

          this.filtrosAplicados = {
            ...consulta,
            page: datos.pagination.page,
            limit: datos.pagination.limit,
          };

          this.filtros = { ...this.filtrosAplicados };
          this.filtrosModificados = false;
        },
        error: error => {
          this.datos = null;
          this.filtrosAplicados = null;
          this.errorConsulta = this.mensajeError(error);
        },
      });
  }

  cambiarPagina(pagina: number): void {
    if (
      this.isLoading ||
      this.filtrosModificados ||
      !this.filtrosAplicados ||
      !Number.isInteger(pagina) ||
      pagina < 1 ||
      pagina > this.totalPages
    ) return;

    this.cargarListado({
      ...this.filtrosAplicados,
      page: pagina,
    });
  }

  cambiarLimite(limite: number): void {
    if (
      this.isLoading ||
      this.filtrosModificados ||
      !this.filtrosAplicados ||
      !this.pageSizeOptions.includes(limite)
    ) return;

    this.cargarListado({
      ...this.filtrosAplicados,
      page: 1,
      limit: limite,
    });
  }

  reintentarListado(): void {
    if (this.isLoading) return;

    if (this.filtrosAplicados && !this.filtrosModificados) {
      this.cargarListado({ ...this.filtrosAplicados });
      return;
    }

    this.consultarAuditoria(this.filtros);
  }

  // *********************************************************
  // DETALLE
  // *********************************************************

  abrirDetalle(idAuditoria: AuditoriaId): void {
    this.detalleSub?.unsubscribe();

    this.idDetalle = idAuditoria;
    this.detalle = null;
    this.errorDetalle = '';
    this.detalleAbierto = true;

    this.cargarDetalle(idAuditoria);
  }

  private cargarDetalle(idAuditoria: AuditoriaId): void {
    this.detalleSub?.unsubscribe();

    this.cargandoDetalle = true;
    this.errorDetalle = '';
    this.detalle = null;

    this.detalleSub = this.auditoriaService
      .getAuditoriaById(idAuditoria)
      .pipe(
        map(respuesta => {
          if (!respuesta.success || !respuesta.data) {
            throw new Error(
              respuesta.message ||
              'No se pudo obtener el evento.',
            );
          }

          return respuesta.data;
        }),
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoDetalle = false;
          this.actualizarVista();
        }),
      )
      .subscribe({
        next: datos => {
          this.detalle = datos;
        },
        error: error => {
          this.errorDetalle = this.mensajeError(error);
        },
      });
  }

  reintentarDetalle(): void {
    if (
      !this.detalleAbierto ||
      this.idDetalle === null ||
      this.cargandoDetalle
    ) return;

    this.cargarDetalle(this.idDetalle);
  }

  cerrarDetalle(): void {
    this.detalleSub?.unsubscribe();
    this.detalleSub = undefined;

    this.detalleAbierto = false;
    this.detalle = null;
    this.idDetalle = null;
    this.errorDetalle = '';
    this.cargandoDetalle = false;
  }

  // *********************************************************
  // ABRIR HISTORIAL DE ENTIDAD
  // *********************************************************

  abrirEntidad(entidad: AuditoriaEntidadSeleccionada): void {
    this.entidadSub?.unsubscribe();

    this.entidadSeleccionada = { ...entidad };
    this.entidadAbierta = true;

    this.historialEntidad = null;
    this.errorEntidad = '';
    this.filtrosEntidadAplicados = null;
    this.filtrosEntidadModificados = false;

    // Solo heredamos el período del listado consultado.
    // No trasladamos módulo, actor o resultado para evitar
    // ocultar otras acciones del historial de esa entidad.
    const periodo = this.filtrosAplicados ??
      this.obtenerPeriodoActual();

    this.filtrosEntidad = {
      fecha_inicio: periodo.fecha_inicio,
      fecha_fin: periodo.fecha_fin,
      page: 1,
      limit: 20,
      sort_order: 'DESC',
    };

    this.consultarEntidad(this.filtrosEntidad);
  }

  actualizarFiltrosEntidad(
    filtros: AuditoriaEntidadFilters,
  ): void {
    if (this.cargandoEntidad) return;

    this.filtrosEntidad = { ...filtros };
    this.filtrosEntidadModificados = true;
    this.errorEntidad = '';
  }

  consultarEntidad(filtros: AuditoriaEntidadFilters): void {
    if (
      !this.entidadSeleccionada ||
      this.cargandoEntidad
    ) return;

    const consulta: AuditoriaEntidadFilters = {
      ...filtros,
      page: 1,
      limit: filtros.limit ?? 20,
      sort_order: filtros.sort_order ?? 'DESC',
    };

    try {
      this.validarPeriodo(consulta);
    } catch (error) {
      this.errorEntidad = this.mensajeError(error);
      return;
    }

    this.filtrosEntidad = { ...consulta };
    this.cargarEntidad(consulta);
  }

  // *********************************************************
  // CONSULTAR HISTORIAL DE ENTIDAD
  // *********************************************************

  private cargarEntidad(consulta: AuditoriaEntidadFilters): void {
    const entidad = this.entidadSeleccionada;

    if (!entidad) return;

    this.entidadSub?.unsubscribe();

    this.cargandoEntidad = true;
    this.errorEntidad = '';

    this.entidadSub = this.auditoriaService
      .getAuditoriaByEntidad(
        entidad.tipoEntidad,
        entidad.idEntidad,
        consulta,
      )
      .pipe(
        map(respuesta => {
          if (!respuesta.success || !respuesta.data) {
            throw new Error(
              respuesta.message ||
              'No se pudo obtener el historial de la entidad.',
            );
          }

          return respuesta.data;
        }),
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoEntidad = false;
          this.actualizarVista();
        }),
      )
      .subscribe({
        next: datos => {
          this.historialEntidad = datos;

          this.filtrosEntidadAplicados = {
            ...consulta,
            page: datos.pagination.page,
            limit: datos.pagination.limit,
          };

          this.filtrosEntidad = {
            ...this.filtrosEntidadAplicados,
          };

          this.filtrosEntidadModificados = false;
        },
        error: error => {
          this.historialEntidad = null;
          this.filtrosEntidadAplicados = null;
          this.errorEntidad = this.mensajeError(error);
        },
      });
  }

  cambiarPaginaEntidad(pagina: number): void {
    if (
      this.cargandoEntidad ||
      this.filtrosEntidadModificados ||
      !this.filtrosEntidadAplicados ||
      !this.historialEntidad ||
      !Number.isInteger(pagina) ||
      pagina < 1 ||
      pagina > this.historialEntidad.pagination.total_pages
    ) return;

    this.cargarEntidad({
      ...this.filtrosEntidadAplicados,
      page: pagina,
    });
  }

  cerrarEntidad(): void {
    // Si el detalle se abrió encima del historial,
    // también lo cerramos antes de cerrar este modal.
    this.cerrarDetalle();

    this.entidadSub?.unsubscribe();
    this.entidadSub = undefined;

    this.entidadAbierta = false;
    this.entidadSeleccionada = null;

    this.historialEntidad = null;
    this.filtrosEntidadAplicados = null;

    this.filtrosEntidadModificados = false;
    this.cargandoEntidad = false;
    this.errorEntidad = '';
  }

  // *********************************************************
  // FECHAS
  // *********************************************************

  private obtenerPeriodoActual(): {
    fecha_inicio: string;
    fecha_fin: string;
  } {
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(new Date());

    const anio = Number(
      partes.find(parte => parte.type === 'year')?.value,
    );

    const mes = Number(
      partes.find(parte => parte.type === 'month')?.value,
    );

    const ultimoDia = new Date(
      Date.UTC(anio, mes, 0),
    ).getUTCDate();

    const prefijo = `${anio}-${String(mes).padStart(2, '0')}`;

    return {
      fecha_inicio: `${prefijo}-01`,
      fecha_fin: `${prefijo}-${ultimoDia}`,
    };
  }

  private validarPeriodo(filtros: {
    fecha_inicio: string;
    fecha_fin: string;
  }): void {
    const convertir = (valor: string): number => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        throw new Error('Selecciona fechas válidas.');
      }

      const fecha = new Date(`${valor}T00:00:00Z`);

      if (
        !Number.isFinite(fecha.getTime()) ||
        fecha.toISOString().slice(0, 10) !== valor
      ) {
        throw new Error('Selecciona fechas válidas.');
      }

      return fecha.getTime();
    };

    const dias = (
      convertir(filtros.fecha_fin) -
      convertir(filtros.fecha_inicio)
    ) / 86400000 + 1;

    if (dias < 1 || dias > 366) {
      throw new Error(
        'El período debe comprender entre 1 y 366 días.',
      );
    }
  }

  // *********************************************************
  // ERRORES
  // *********************************************************

  private mensajeError(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return 'No se pudo completar la consulta. Intenta nuevamente.';
  }
}
