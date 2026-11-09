import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DOCUMENT, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, Observable, Subject, Subscription, catchError, expand, finalize, forkJoin, map, of, reduce, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { ReportesServices } from '../../services/reportes.service';
import { ZonasServices } from 'src/app/features/zonas/services/zonas.service';
import { RutasServices } from 'src/app/features/rutas/services/rutas.service';
import { VehiculosService } from 'src/app/features/vehiculos/services/vehiculos.service';

// Interfaces
import { ApiResponse } from 'src/app/core/models/api-response.model';
import { ExportarReporteRequest, ReporteFormatoExportacion, ReporteResumenData, ReporteTipoExportable } from '../../interfaces';

// Subcomponentes
import { ReporteOpcionCatalogo, ReportesFiltrosComponent, ReportesFiltrosFormulario } from '../components/reportes-filtros/reportes-filtros.component';
import { ReportesTablaComponent } from '../components/reportes-tabla/reportes-tabla.component';
import { ReportesResumenComponent, ReporteResumenTarjetaVista } from '../components/reportes-resumen/reportes-resumen.component';
import { ReportesExportacionComponent, ReporteExportacionColumnaVista } from '../components/reportes-exportacion/reportes-exportacion.component';
import { ReportesCantidadesComponent, ReporteCantidadVista } from '../components/reportes-cantidades/reportes-cantidades.component';

// *********************************************************
// CONTRATOS DE PRESENTACIÓN
// *********************************************************

interface PaginaCatalogo {
  items: ReporteOpcionCatalogo[];
  page: number;
  totalPages: number;
}

interface PaginacionReporte {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface ListadoCompatible {
  columnas: readonly {
    key: string;
    titulo: string;
  }[];

  items: readonly object[];

  resumen: {
    total: number;

    por_estado: readonly {
      estado: string | null;
      total: number;
    }[];

    cantidades_por_unidad?: readonly ReporteCantidadVista[];
    resultados_pendientes?: number;
  };

  pagination: PaginacionReporte;

  metadata: {
    base_fecha: string;
    generado_en: string;
  };
}

interface VistaReporte {
  columnas: readonly {
    key: string;
    titulo: string;
  }[];

  items: Record<string, unknown>[];
  tarjetas: ReporteResumenTarjetaVista[];
  cantidades: readonly ReporteCantidadVista[];

  pagination: PaginacionReporte | null;
  nota: string;
  generado: string;
}

// *********************************************************
// CONFIGURACIÓN PARA VALIDAR LAS SOLICITUDES
// *********************************************************

const TITULOS: Record<ReporteTipoExportable, string> = {
  RESUMEN_OPERATIVO: 'Resumen operativo',
  PROGRAMACIONES: 'Programaciones',
  RECORRIDOS: 'Recorridos',
  RECOLECCIONES: 'Residuos recolectados',
  ATENCION_PUNTOS: 'Atención de puntos',
  INCIDENCIAS: 'Incidencias',
  VEHICULOS: 'Vehículos',
  MANTENIMIENTOS: 'Mantenimientos',
  REPORTES_CIUDADANOS: 'Incidencias ciudadanas',
};

const ESTADOS = {
  PROGRAMACIONES: [
    'PROGRAMADA', 'ASIGNADA', 'ACEPTADA', 'EN_CURSO',
    'PAUSADA', 'FINALIZADA', 'CANCELADA',
  ],
  RECORRIDOS: [
    'EN_CURSO', 'PAUSADO', 'FINALIZADO', 'CANCELADO',
  ],
  ATENCION_PUNTOS: [
    'ATENDIDO',
    'OMITIDO',
    'PENDIENTE',
  ],
  INCIDENCIAS: [
    'REPORTADA', 'EN_REVISION', 'EN_ATENCION',
    'RESUELTA', 'RECHAZADA', 'CANCELADA',
  ],
  VEHICULOS: [
    'DISPONIBLE', 'ASIGNADO', 'EN_RUTA',
    'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO',
  ],
  MANTENIMIENTOS: [
    'PROGRAMADO', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO',
  ],
} as const;

const UNIDADES = ['KG', 'TONELADA', 'LITRO', 'M3'] as const;
const TIPOS_MANTENIMIENTO = ['PREVENTIVO', 'CORRECTIVO'] as const;
const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] as const;

const TIPOS_INCIDENCIA = [
  'VIA_BLOQUEADA',
  'AVERIA_VEHICULO',
  'ACCIDENTE',
  'RECOLECCION_NO_REALIZADA',
  'ACUMULACION_RESIDUOS',
  'PUNTO_INACCESIBLE',
  'OTRO',
] as const;

const ORIGENES = [
  'APP_OPERATIVA',
  'APP_CIUDADANA',
  'WEB_MUNICIPAL',
  'WEB_CIUDADANA',
] as const;

const ORIGENES_CIUDADANOS = [
  'APP_CIUDADANA',
  'WEB_CIUDADANA',
] as const;

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReportesFiltrosComponent,
    ReportesTablaComponent,
    ReportesResumenComponent,
    ReportesExportacionComponent,
    ReportesCantidadesComponent,
  ],
  templateUrl: './reportes-page.component.html',
})
export class ReportesPageComponent implements OnInit, OnDestroy {

  // *********************************************************
  // ESTADO
  // *********************************************************

  filtros = this.crearFiltrosIniciales();

  formatoExportacion: ReporteFormatoExportacion = 'xlsx';

  isLoading = false;
  exportando = false;
  catalogosCargando = false;
  filtrosModificados = false;

  errorConsulta = '';
  erroresCatalogos: string[] = [];

  zonas: ReporteOpcionCatalogo[] = [];
  rutas: ReporteOpcionCatalogo[] = [];
  vehiculos: ReporteOpcionCatalogo[] = [];

  vista: VistaReporte | null = null;
  columnas: ReporteExportacionColumnaVista[] = [];
  solicitudAplicada: ExportarReporteRequest | null = null;

  page = 1;
  limit = 20;
  totalItems = 0;
  totalPages = 0;

  readonly pageSizeOptions = [10, 20, 50, 100];

  private consultaSub?: Subscription;
  private readonly destroy$ = new Subject<void>();
  private destruido = false;

  constructor(
    private readonly reportesService: ReportesServices,
    private readonly zonasService: ZonasServices,
    private readonly rutasService: RutasServices,
    private readonly vehiculosService: VehiculosService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private readonly document: Document,
  ) { }

  // *********************************************************
  // CICLO DE VIDA
  // *********************************************************

  ngOnInit(): void {
    this.cargarCatalogos();
    this.aplicarFiltros();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.destroy$.next();
    this.destroy$.complete();
    this.consultaSub?.unsubscribe();
  }

  private actualizarVista(): void {
    if (!this.destruido) {
      this.cdr.markForCheck();
    }
  }

  // *********************************************************
  // PROPIEDADES CALCULADAS
  // *********************************************************

  get tituloReporte(): string {
    const tipo =
      this.solicitudAplicada?.tipo_reporte ??
      this.filtros.tipoReporte;

    return TITULOS[tipo];
  }

  get mostrarCantidades(): boolean {
    const tipo = this.solicitudAplicada?.tipo_reporte;

    return (
      tipo === 'RESUMEN_OPERATIVO' ||
      tipo === 'RECOLECCIONES'
    );
  }

  get columnasVisibles(): ReporteExportacionColumnaVista[] {
    return this.columnas.filter(columna => columna.seleccionada);
  }

  get desde(): number {
    return this.totalItems
      ? (this.page - 1) * this.limit + 1
      : 0;
  }

  get hasta(): number {
    return Math.min(this.page * this.limit, this.totalItems);
  }

  get puedeExportar(): boolean {
    return (
      !!this.solicitudAplicada &&
      !this.isLoading &&
      !this.exportando &&
      !this.filtrosModificados &&
      (
        this.solicitudAplicada.tipo_reporte === 'RESUMEN_OPERATIVO' ||
        this.columnasVisibles.length > 0
      )
    );
  }

  // *********************************************************
  // FILTROS
  // *********************************************************

  private crearFiltrosIniciales(
    tipoReporte: ReporteTipoExportable = 'RESUMEN_OPERATIVO',
  ): ReportesFiltrosFormulario {
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
      tipoReporte,
      fechaInicio: `${prefijo}-01`,
      fechaFin: `${prefijo}-${ultimoDia}`,
      zonaBusqueda: null,
      rutaBusqueda: null,
      vehiculoBusqueda: null,
      turnoBusqueda: '',
      estadoBusqueda: '',
      unidadBusqueda: '',
      tipoIncidenciaBusqueda: '',
      prioridadBusqueda: '',
      origenBusqueda: '',
      tipoMantenimientoBusqueda: '',
    };
  }

  actualizarFiltros(filtros: ReportesFiltrosFormulario): void {
    if (this.isLoading || this.exportando) return;

    if (filtros.tipoReporte !== this.filtros.tipoReporte) {
      this.consultaSub?.unsubscribe();
      this.limpiarResultados();
    }

    this.filtros = { ...filtros };
    this.filtrosModificados = true;
  }

  limpiarFiltros(): void {
    if (this.isLoading || this.exportando) return;

    this.filtros = this.crearFiltrosIniciales(
      this.filtros.tipoReporte,
    );

    this.filtrosModificados = true;
    this.aplicarFiltros();
  }

  actualizarColumnas(
    columnas: ReporteExportacionColumnaVista[],
  ): void {
    if (!this.isLoading && !this.exportando) {
      this.columnas = columnas;
    }
  }

  private limpiarResultados(): void {
    this.vista = null;
    this.columnas = [];
    this.solicitudAplicada = null;
    this.page = 1;
    this.totalItems = 0;
    this.totalPages = 0;
    this.errorConsulta = '';
  }

  // *********************************************************
  // VALIDACIÓN Y CONSTRUCCIÓN DE LA SOLICITUD
  // *********************************************************

  private validarFechas(): void {
    const convertir = (valor: string): number => {
      const fecha = Date.parse(`${valor}T00:00:00Z`);

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(valor) ||
        !Number.isFinite(fecha) ||
        new Date(fecha).toISOString().slice(0, 10) !== valor
      ) {
        throw new Error('Selecciona fechas válidas.');
      }

      return fecha;
    };

    const dias = (
      convertir(this.filtros.fechaFin) -
      convertir(this.filtros.fechaInicio)
    ) / 86400000 + 1;

    if (dias < 1 || dias > 366) {
      throw new Error(
        'El período debe comprender entre 1 y 366 días.',
      );
    }
  }

  private opcion<T extends string>(
    valor: string,
    opciones: readonly T[],
  ): T | undefined {
    if (!valor) return undefined;

    const opcion = opciones.find(item => item === valor);

    if (!opcion) {
      throw new Error('Revisa las opciones de los filtros.');
    }

    return opcion;
  }

  private construirSolicitud(): ExportarReporteRequest {
    this.validarFechas();

    const f = this.filtros;
    const formato = this.formatoExportacion;

    const fechas = {
      fecha_inicio: f.fechaInicio,
      fecha_fin: f.fechaFin,
    };

    const base = {
      ...fechas,
      id_zona: f.zonaBusqueda ?? undefined,
      id_ruta: f.rutaBusqueda ?? undefined,
      id_vehiculo: f.vehiculoBusqueda ?? undefined,
      turno: f.turnoBusqueda || undefined,
    };

    // Se construye únicamente para los reportes de incidencias.
    const incidencia = () => ({
      ...base,
      estado: this.opcion(f.estadoBusqueda, ESTADOS.INCIDENCIAS),
      tipo: this.opcion(f.tipoIncidenciaBusqueda, TIPOS_INCIDENCIA),
      prioridad: this.opcion(f.prioridadBusqueda, PRIORIDADES),
    });

    switch (f.tipoReporte) {
      case 'RESUMEN_OPERATIVO':
        return {
          tipo_reporte: f.tipoReporte,
          formato,
          filtros: base,
        };

      case 'PROGRAMACIONES':
        return {
          tipo_reporte: f.tipoReporte,
          formato,
          filtros: {
            ...base,
            estado: this.opcion(f.estadoBusqueda, ESTADOS.PROGRAMACIONES),
          },
        };

      case 'RECORRIDOS':
        return {
          tipo_reporte: f.tipoReporte,
          formato,
          filtros: {
            ...base,
            estado: this.opcion(f.estadoBusqueda, ESTADOS.RECORRIDOS),
          },
        };

      case 'RECOLECCIONES':
        return {
          tipo_reporte: f.tipoReporte,
          formato,
          filtros: {
            ...base,
            unidad_medida: this.opcion(f.unidadBusqueda, UNIDADES),
          },
        };

      case 'ATENCION_PUNTOS':
        return {
          tipo_reporte: f.tipoReporte,
          formato,
          filtros: {
            ...base,
            estado: this.opcion(f.estadoBusqueda, ESTADOS.ATENCION_PUNTOS),
          },
        };

      case 'INCIDENCIAS':
        return {
          tipo_reporte: f.tipoReporte,
          formato,
          filtros: {
            ...incidencia(),
            origen: this.opcion(f.origenBusqueda, ORIGENES),
          },
        };

      case 'REPORTES_CIUDADANOS':
        return {
          tipo_reporte: f.tipoReporte,
          formato,
          filtros: {
            ...incidencia(),
            origen: this.opcion(f.origenBusqueda, ORIGENES_CIUDADANOS),
          },
        };

      case 'VEHICULOS':
        return {
          tipo_reporte: f.tipoReporte,
          formato,
          filtros: {
            ...base,
            estado: this.opcion(f.estadoBusqueda, ESTADOS.VEHICULOS),
          },
        };

      case 'MANTENIMIENTOS':
        return {
          tipo_reporte: f.tipoReporte,
          formato,
          filtros: {
            ...fechas,
            id_vehiculo: f.vehiculoBusqueda ?? undefined,
            tipo_mantenimiento: this.opcion(
              f.tipoMantenimientoBusqueda,
              TIPOS_MANTENIMIENTO,
            ),
            estado: this.opcion(f.estadoBusqueda, ESTADOS.MANTENIMIENTOS),
          },
        };
    }
  }

  // *********************************************************
  // CONSULTAS
  // *********************************************************

  aplicarFiltros(): void {
    if (this.isLoading || this.exportando) return;

    try {
      this.consultar(this.construirSolicitud(), 1);
    } catch (error) {
      void Swal.fire({
        icon: 'warning',
        title: 'Revisa los filtros',
        text: this.mensajeError(error),
      });
    }
  }

  private consultar(
    solicitud: ExportarReporteRequest,
    pagina: number,
  ): void {
    this.consultaSub?.unsubscribe();

    this.isLoading = true;
    this.errorConsulta = '';

    this.consultaSub = this.obtenerReporte(solicitud, pagina)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.actualizarVista();
        }),
      )
      .subscribe({
        next: vista => {
          const anteriores = new Map(
            this.columnas.map(columna => [
              columna.key,
              columna.seleccionada,
            ]),
          );

          this.columnas = vista.columnas.map(columna => ({
            ...columna,
            seleccionada: anteriores.get(columna.key) ?? true,
          }));

          this.vista = vista;
          this.solicitudAplicada = solicitud;
          this.filtrosModificados = false;

          this.page = vista.pagination?.page ?? 1;
          this.limit = vista.pagination?.limit ?? this.limit;
          this.totalItems = vista.pagination?.total ?? 0;
          this.totalPages = vista.pagination?.total_pages ?? 0;
        },
        error: error => {
          this.limpiarResultados();
          this.errorConsulta = this.mensajeError(error);
        },
      });
  }

  private obtenerReporte(
    solicitud: ExportarReporteRequest,
    page: number,
  ): Observable<VistaReporte> {
    const paginacion = { page, limit: this.limit };

    switch (solicitud.tipo_reporte) {
      case 'RESUMEN_OPERATIVO':
        return this.reportesService
          .getReporteResumen(solicitud.filtros)
          .pipe(map(respuesta =>
            this.adaptarResumen(this.validarRespuesta(respuesta)),
          ));

      case 'PROGRAMACIONES':
        return this.reportesService
          .getReporteProgramaciones({ ...solicitud.filtros, ...paginacion })
          .pipe(map(respuesta => this.adaptarLista(respuesta)));

      case 'RECORRIDOS':
        return this.reportesService
          .getReporteRecorridos({ ...solicitud.filtros, ...paginacion })
          .pipe(map(respuesta => this.adaptarLista(respuesta)));

      case 'RECOLECCIONES':
        return this.reportesService
          .getReporteRecolecciones({ ...solicitud.filtros, ...paginacion })
          .pipe(map(respuesta => this.adaptarLista(respuesta)));

      case 'ATENCION_PUNTOS':
        return this.reportesService
          .getReporteAtencion({ ...solicitud.filtros, ...paginacion })
          .pipe(map(respuesta => this.adaptarLista(respuesta)));

      case 'INCIDENCIAS':
        return this.reportesService
          .getReporteIncidencias({ ...solicitud.filtros, ...paginacion })
          .pipe(map(respuesta => this.adaptarLista(respuesta)));

      case 'VEHICULOS':
        return this.reportesService
          .getReporteVehiculos({ ...solicitud.filtros, ...paginacion })
          .pipe(map(respuesta => this.adaptarLista(respuesta)));

      case 'MANTENIMIENTOS':
        return this.reportesService
          .getReporteMantenimientos({ ...solicitud.filtros, ...paginacion })
          .pipe(map(respuesta => this.adaptarLista(respuesta)));

      case 'REPORTES_CIUDADANOS':
        return this.reportesService
          .getReporteCiudadanos({ ...solicitud.filtros, ...paginacion })
          .pipe(map(respuesta => this.adaptarLista(respuesta)));
    }
  }

  private validarRespuesta<T>(respuesta: ApiResponse<T>): T {
    if (!respuesta.success || respuesta.data == null) {
      throw new Error(
        respuesta.message || 'La respuesta no contiene datos.',
      );
    }

    return respuesta.data;
  }

  // *********************************************************
  // ADAPTACIÓN DE RESPUESTAS PARA LOS SUBCOMPONENTES
  // *********************************************************

  private adaptarLista(
    respuesta: ApiResponse<ListadoCompatible>,
  ): VistaReporte {
    const datos = this.validarRespuesta(respuesta);
    const pendientes = datos.resumen.resultados_pendientes;

    return {
      columnas: datos.columnas,
      items: datos.items.map(item =>
        Object.fromEntries(Object.entries(item)),
      ),
      tarjetas: [{
        titulo: 'Total de registros filtrados',
        total: datos.resumen.total,
        estados: datos.resumen.por_estado,
        detalle: pendientes === undefined
          ? undefined
          : `${pendientes} resultado(s) final(es) pendiente(s)`,
      }],
      cantidades: datos.resumen.cantidades_por_unidad ?? [],
      pagination: datos.pagination,
      nota: datos.metadata.base_fecha,
      generado: datos.metadata.generado_en,
    };
  }

  private adaptarResumen(datos: ReporteResumenData): VistaReporte {
    const resumen = datos.resumen;

    return {
      columnas: [],
      items: [],
      pagination: null,
      tarjetas: [
        {
          titulo: 'Programaciones',
          total: resumen.programaciones.total,
          estados: resumen.programaciones.por_estado,
        },
        {
          titulo: 'Recorridos',
          total: resumen.recorridos.total,
          estados: resumen.recorridos.por_estado,
        },
        {
          titulo: 'Puntos de recolección',
          total: resumen.atencion_puntos.total,
          estados: resumen.atencion_puntos.por_estado,
        },
        {
          titulo: 'Control de residuos',
          total: resumen.recolecciones.total,
          estados: resumen.recolecciones.por_estado,
          detalle:
            `${resumen.recolecciones.resultados_pendientes} ` +
            'resultado(s) pendiente(s) de ' +
            `${resumen.recolecciones.total} recorrido(s) finalizado(s)`,
        },
        {
          titulo: 'Incidencias',
          total: resumen.incidencias.total,
          estados: resumen.incidencias.por_estado,
        },
      ],
      cantidades: resumen.recolecciones.cantidades_por_unidad,
      nota: datos.metadata.nota,
      generado: datos.metadata.generado_en,
    };
  }

  // *********************************************************
  // PAGINACIÓN
  // *********************************************************

  cambiarPagina(pagina: number): void {
    if (
      !this.solicitudAplicada ||
      this.isLoading ||
      this.exportando ||
      this.filtrosModificados ||
      !Number.isInteger(pagina) ||
      pagina < 1 ||
      pagina > this.totalPages
    ) return;

    this.consultar(this.solicitudAplicada, pagina);
  }

  cambiarLimite(valor: number): void {
    if (
      !this.solicitudAplicada ||
      this.isLoading ||
      this.exportando ||
      this.filtrosModificados ||
      !this.pageSizeOptions.includes(valor)
    ) return;

    this.limit = valor;
    this.consultar(this.solicitudAplicada, 1);
  }

  // *********************************************************
  // EXPORTACIÓN
  // *********************************************************

  exportar(): void {
    if (!this.puedeExportar || !this.solicitudAplicada) return;

    // Las claves seleccionadas provienen del reporte consultado.
    const request = {
      ...this.solicitudAplicada,
      formato: this.formatoExportacion,
      columnas:
        this.solicitudAplicada.tipo_reporte === 'RESUMEN_OPERATIVO'
          ? undefined
          : this.columnasVisibles.map(columna => columna.key),
    } as ExportarReporteRequest;

    this.exportando = true;

    this.reportesService.exportarReporte(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.exportando = false;
          this.actualizarVista();
        }),
      )
      .subscribe({
        next: respuesta => {
          try {
            if (!respuesta.body?.size) {
              throw new Error('El servidor devolvió un archivo vacío.');
            }

            const nombre = this.nombreArchivo(
              respuesta.headers.get('Content-Disposition') ?? '',
              `reporte.${request.formato}`,
            );

            this.descargarArchivo(respuesta.body, nombre);

            void Swal.fire({
              icon: 'success',
              title: 'Descarga solicitada',
              text: nombre,
              timer: 1800,
              showConfirmButton: false,
            });
          } catch (error) {
            this.mostrarErrorExportacion(error);
          }
        },
        error: error => this.mostrarErrorExportacion(error),
      });
  }

  private descargarArchivo(archivo: Blob, nombre: string): void {
    const url = URL.createObjectURL(archivo);
    const enlace = this.document.createElement('a');

    try {
      enlace.href = url;
      enlace.download = nombre;
      this.document.body.appendChild(enlace);
      enlace.click();
    } finally {
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  private nombreArchivo(header: string, fallback: string): string {
    let nombre =
      /filename="?([^";]+)"?/i.exec(header)?.[1] || fallback;

    const utf8 =
      /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header)?.[1];

    if (utf8) {
      try {
        nombre = decodeURIComponent(utf8.trim());
      } catch {
        // Conserva el nombre alternativo.
      }
    }

    return nombre.replace(/[\\/\u0000-\u001f]/g, '_');
  }

  private mostrarErrorExportacion(error: unknown): void {
    void Swal.fire({
      icon: 'error',
      title: 'No se pudo exportar',
      text: this.mensajeError(error),
    });
  }

  // *********************************************************
  // CATÁLOGOS
  // *********************************************************

  private todasLasPaginas(
    pedir: (page: number) => Observable<PaginaCatalogo>,
  ): Observable<ReporteOpcionCatalogo[]> {
    const leer = (page: number) => pedir(page).pipe(
      map(datos => {
        if (
          datos.page !== page ||
          !Number.isInteger(datos.totalPages) ||
          datos.totalPages < 0
        ) {
          throw new Error('Paginación de catálogo no válida.');
        }

        return datos;
      }),
    );

    return leer(1).pipe(
      expand(datos =>
        datos.page < datos.totalPages
          ? leer(datos.page + 1)
          : EMPTY,
      ),
      reduce(
        (todos: ReporteOpcionCatalogo[], datos) =>
          todos.concat(datos.items),
        [],
      ),
    );
  }

  cargarCatalogos(): void {
    if (this.catalogosCargando) return;

    this.catalogosCargando = true;
    this.erroresCatalogos = [];

    const seguro = (
      nombre: string,
      consulta: Observable<ReporteOpcionCatalogo[]>,
    ) => consulta.pipe(
      catchError(() => {
        this.erroresCatalogos.push(`No se pudo cargar ${nombre}.`);
        return of<ReporteOpcionCatalogo[]>([]);
      }),
    );

    forkJoin({
      zonas: seguro(
        'el catálogo de zonas',
        this.todasLasPaginas(page =>
          this.zonasService.getZonasPaginated({ page, limit: 100 })
            .pipe(map(respuesta => {
              const datos = this.validarRespuesta(respuesta);

              return {
                page: datos.page,
                totalPages: datos.total_pages,
                items: datos.items.map(zona => ({
                  id: zona.id_zona,
                  nombre: zona.nombre,
                })),
              };
            })),
        ),
      ),
      rutas: seguro(
        'el catálogo de rutas',
        this.todasLasPaginas(page =>
          this.rutasService.getRutasPaginated({ page, limit: 100 })
            .pipe(map(respuesta => {
              const datos = this.validarRespuesta(respuesta);

              return {
                page: datos.page,
                totalPages: datos.total_pages,
                items: datos.items.map(ruta => ({
                  id: ruta.id_ruta,
                  nombre: ruta.nombre,
                  id_zona: ruta.id_zona,
                })),
              };
            })),
        ),
      ),
      vehiculos: seguro(
        'el catálogo de vehículos',
        this.todasLasPaginas(page =>
          this.vehiculosService.getVehiculosPaginated({ page, limit: 100 })
            .pipe(map(respuesta => {
              const datos = this.validarRespuesta(respuesta);

              return {
                page: datos.page,
                totalPages: datos.totalPages,
                items: datos.items.map(vehiculo => ({
                  id: vehiculo.id_vehiculo,
                  nombre: `${vehiculo.placa} · ${vehiculo.codigo}`,
                })),
              };
            })),
        ),
      ),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.catalogosCargando = false;
          this.actualizarVista();
        }),
      )
      .subscribe(({ zonas, rutas, vehiculos }) => {
        this.zonas = zonas;
        this.rutas = rutas;
        this.vehiculos = vehiculos;
      });
  }

  private mensajeError(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return 'No se pudo completar la operación. Intenta nuevamente.';
  }
}
