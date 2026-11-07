import { ApiResponse } from 'src/app/core/models/api-response.model';

import {
  ReporteIncidenciasFilters,
  ReporteIncidenciasFiltrosAplicados,
  ReporteIncidenciaItem,
  ReporteIncidenciasPagination,
  ReporteIncidenciasMetadata,
} from './reporte-incidencias.interface';

import {
  ReporteEstadoIncidencia,
  ReporteResumenConteos,
} from './reporte-resumen.interface';

// *********************************************************
// 1. ORIGEN CIUDADANO
// *********************************************************
export type ReporteOrigenCiudadano =
  | 'APP_CIUDADANA'
  | 'WEB_CIUDADANA';

// *********************************************************
// 2. FILTROS
// Hereda fechas, IDs, estado, tipo, prioridad y paginación.
// *********************************************************
export interface ReporteCiudadanosFilters
  extends Omit<ReporteIncidenciasFilters, 'origen'> {

  origen?: ReporteOrigenCiudadano | null;
}

// *********************************************************
// 3. FILTROS APLICADOS
// *********************************************************
export interface ReporteCiudadanosFiltrosAplicados
  extends Omit<
    ReporteIncidenciasFiltrosAplicados,
    'origen'
  > {

  origen?: ReporteOrigenCiudadano;
}

// *********************************************************
// 4. REGISTRO DEL REPORTE
// Hereda los campos y valores nullable de una incidencia.
// *********************************************************
export interface ReporteCiudadanoItem
  extends Omit<ReporteIncidenciaItem, 'origen'> {

  origen: ReporteOrigenCiudadano;
}

// *********************************************************
// 5. COLUMNAS
// *********************************************************
export type ReporteCiudadanosColumnaKey =
  keyof ReporteCiudadanoItem;

export interface ReporteCiudadanosColumna {
  key: ReporteCiudadanosColumnaKey;
  titulo: string;
}

// *********************************************************
// 6. PAGINACIÓN
// *********************************************************
export type ReporteCiudadanosPagination =
  ReporteIncidenciasPagination;

// *********************************************************
// 7. METADATA
// Los campos de ordenamiento coinciden con incidencias.
// *********************************************************
export type ReporteCiudadanosMetadata =
  ReporteIncidenciasMetadata;

// *********************************************************
// 8. DATA DEL ENDPOINT
// *********************************************************
export interface ReporteCiudadanosData {
  tipo_reporte: 'REPORTES_CIUDADANOS';

  filtros_aplicados: ReporteCiudadanosFiltrosAplicados;

  columnas: ReporteCiudadanosColumna[];

  items: ReporteCiudadanoItem[];

  resumen: ReporteResumenConteos<ReporteEstadoIncidencia>;

  pagination: ReporteCiudadanosPagination;

  metadata: ReporteCiudadanosMetadata;
}

// *********************************************************
// 9. RESPUESTA
// *********************************************************
export type GetReporteCiudadanosResponse = ApiResponse<ReporteCiudadanosData>;
