import { ApiResponse } from 'src/app/core/models/api-response.model';

import {
  ReporteEstadoIncidencia,
  ReporteResumenConteos,
  ReporteResumenFilters,
  ReporteResumenFiltrosAplicados,
} from './reporte-resumen.interface';

// *********************************************************
// 1. TIPOS DE INCIDENCIA
// *********************************************************
export type ReporteTipoIncidencia =
  | 'VIA_BLOQUEADA'
  | 'AVERIA_VEHICULO'
  | 'ACCIDENTE'
  | 'RECOLECCION_NO_REALIZADA'
  | 'ACUMULACION_RESIDUOS'
  | 'PUNTO_INACCESIBLE'
  | 'OTRO';

export type ReportePrioridadIncidencia =
  | 'BAJA'
  | 'MEDIA'
  | 'ALTA'
  | 'CRITICA';

export type ReporteOrigenIncidencia =
  | 'APP_OPERATIVA'
  | 'APP_CIUDADANA'
  | 'WEB_MUNICIPAL'
  | 'WEB_CIUDADANA';

// *********************************************************
// 2. FILTROS
// *********************************************************
export interface ReporteIncidenciasFilters
  extends ReporteResumenFilters {

  id_incidencia?: number | null;
  id_recorrido?: number | null;

  /** Usuario que reportó la incidencia. */
  id_usuario?: number | null;

  /** Usuario responsable de atenderla. */
  id_responsable?: number | null;

  estado?: ReporteEstadoIncidencia | null;
  tipo?: ReporteTipoIncidencia | null;
  prioridad?: ReportePrioridadIncidencia | null;
  origen?: ReporteOrigenIncidencia | null;

  page?: number | null;
  limit?: number | null;

  sort_by?: ReporteIncidenciasColumnaKey | null;
  sort_order?: 'ASC' | 'DESC' | null;
}

// *********************************************************
// 3. FILTROS APLICADOS
// *********************************************************
export interface ReporteIncidenciasFiltrosAplicados
  extends ReporteResumenFiltrosAplicados {

  id_incidencia?: number;
  id_recorrido?: number;
  id_usuario?: number;
  id_responsable?: number;

  estado?: ReporteEstadoIncidencia;
  tipo?: ReporteTipoIncidencia;
  prioridad?: ReportePrioridadIncidencia;
  origen?: ReporteOrigenIncidencia;
}

// *********************************************************
// 4. REGISTRO DEL REPORTE
// *********************************************************
export interface ReporteIncidenciaItem {
  id_incidencia: number;

  /** Puede ser una incidencia sin recorrido asociado. */
  id_recorrido: number | null;

  /** Fecha ISO del reporte. */
  fecha_reporte: string;

  /** Fecha ISO; null mientras no exista resolución. */
  fecha_resolucion: string | null;

  tipo: ReporteTipoIncidencia;
  prioridad: ReportePrioridadIncidencia;
  estado: ReporteEstadoIncidencia;

  titulo: string;
  origen: ReporteOrigenIncidencia;

  id_usuario_reporte: number;
  id_responsable: number | null;

  id_ruta: number | null;
  ruta: string | null;

  id_zona: number | null;
  zona: string | null;

  id_vehiculo: number | null;
  placa: string | null;
}

// *********************************************************
// 5. COLUMNAS
// *********************************************************
export type ReporteIncidenciasColumnaKey =
  keyof ReporteIncidenciaItem;

export interface ReporteIncidenciasColumna {
  key: ReporteIncidenciasColumnaKey;
  titulo: string;
}

// *********************************************************
// 6. PAGINACIÓN
// *********************************************************
export interface ReporteIncidenciasPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// 7. ORDENAMIENTO
// *********************************************************
export interface ReporteIncidenciasOrden {
  sort_by: ReporteIncidenciasColumnaKey;
  sort_order: 'ASC' | 'DESC';
}

// *********************************************************
// 8. METADATA
// *********************************************************
export interface ReporteIncidenciasMetadata {
  zona_horaria: 'America/Lima';
  generado_por: number;

  orden: ReporteIncidenciasOrden;

  base_fecha: string;
  generado_en: string;

  alcance: 'PAGINA';
}

// *********************************************************
// 9. DATA DEL ENDPOINT
// *********************************************************
export interface ReporteIncidenciasData {
  tipo_reporte: 'INCIDENCIAS';

  filtros_aplicados: ReporteIncidenciasFiltrosAplicados;

  columnas: ReporteIncidenciasColumna[];

  items: ReporteIncidenciaItem[];

  resumen: ReporteResumenConteos<ReporteEstadoIncidencia>;

  pagination: ReporteIncidenciasPagination;

  metadata: ReporteIncidenciasMetadata;
}

// *********************************************************
// 10. RESPUESTA
// *********************************************************
export type GetReporteIncidenciasResponse = ApiResponse<ReporteIncidenciasData>;
