import { ApiResponse } from 'src/app/core/models/api-response.model';

// *********************************************************
// 1. FILTROS DE CONSULTA
// *********************************************************
export interface ReporteResumenFilters {
  /** Formato YYYY-MM-DD. */
  fecha_inicio: string;

  /** Formato YYYY-MM-DD. */
  fecha_fin: string;

  id_zona?: number | null;
  id_ruta?: number | null;
  id_vehiculo?: number | null;
  turno?: string | null;
}

// *********************************************************
// 2. FILTROS APLICADOS POR EL BACKEND
// *********************************************************
export interface ReporteResumenFiltrosAplicados {
  fecha_inicio: string;
  fecha_fin: string;

  id_zona?: number;
  id_ruta?: number;
  id_vehiculo?: number;
  turno?: string;
}

// *********************************************************
// 3. ESTADOS
// *********************************************************
export type ReporteEstadoProgramacion =
  | 'PROGRAMADA'
  | 'ASIGNADA'
  | 'ACEPTADA'
  | 'EN_CURSO'
  | 'PAUSADA'
  | 'FINALIZADA'
  | 'CANCELADA';

export type ReporteEstadoRecorrido =
  | 'EN_CURSO'
  | 'PAUSADO'
  | 'FINALIZADO'
  | 'CANCELADO';

export type ReporteEstadoAtencion =
  | 'ATENDIDO'
  | 'OMITIDO'
  | 'PENDIENTE';

export type ReporteEstadoIncidencia =
  | 'REPORTADA'
  | 'EN_REVISION'
  | 'EN_ATENCION'
  | 'RESUELTA'
  | 'RECHAZADA'
  | 'CANCELADA';

export type ReporteUnidadMedida =
  | 'KG'
  | 'TONELADA'
  | 'LITRO'
  | 'M3';

// *********************************************************
// 4. CONTEOS POR ESTADO
// La respuesta contiene un arreglo, no un diccionario.
// *********************************************************
export interface ReporteConteoPorEstado<
  TEstado extends string = string,
> {
  estado: TEstado;
  total: number;
}

export interface ReporteResumenConteos<
  TEstado extends string = string,
> {
  total: number;
  por_estado: ReporteConteoPorEstado<TEstado>[];
}

// *********************************************************
// 5. CANTIDADES POR UNIDAD
// *********************************************************
export interface ReporteCantidadPorUnidad {
  unidad_medida: ReporteUnidadMedida;

  /** Decimal enviado por MySQL, por ejemplo "25.000". */
  cantidad_total: string;

  /** Recorridos con medición incluida en esta unidad. */
  recorridos: number;
}

// *********************************************************
// 6. RESUMEN DE RESIDUOS RECOLECTADOS
// *********************************************************
export interface ReporteResumenRecolecciones
  extends ReporteResumenConteos<'FINALIZADO'> {

  cantidades_por_unidad: ReporteCantidadPorUnidad[];

  /** Recorridos finalizados sin resultado final registrado. */
  resultados_pendientes: number;
}

// *********************************************************
// 7. RESUMEN OPERATIVO
// *********************************************************
export interface ReporteResumenOperativo {
  programaciones:
  ReporteResumenConteos<ReporteEstadoProgramacion>;

  recorridos:
  ReporteResumenConteos<ReporteEstadoRecorrido>;

  atencion_puntos:
  ReporteResumenConteos<ReporteEstadoAtencion>;

  recolecciones:
  ReporteResumenRecolecciones;

  incidencias:
  ReporteResumenConteos<ReporteEstadoIncidencia>;
}

// *********************************************************
// 8. METADATA
// *********************************************************
export interface ReporteResumenMetadata {
  zona_horaria: 'America/Lima';
  generado_por: number;

  /** Fecha ISO del servidor. */
  generado_en: string;

  nota: string;
}

// *********************************************************
// 9. DATA DEL ENDPOINT
// *********************************************************
export interface ReporteResumenData {
  tipo_reporte: 'RESUMEN_OPERATIVO';

  filtros_aplicados: ReporteResumenFiltrosAplicados;

  resumen: ReporteResumenOperativo;

  metadata: ReporteResumenMetadata;
}

// *********************************************************
// 10. RESPUESTA
// *********************************************************
export type GetReporteResumenResponse =
  ApiResponse<ReporteResumenData>;
