import { ApiResponse } from 'src/app/core/models/api-response.model';

import {
  ReporteEstadoProgramacion,
  ReporteResumenConteos,
  ReporteResumenFilters,
  ReporteResumenFiltrosAplicados,
} from './reporte-resumen.interface';

// *********************************************************
// 1. FILTROS
// *********************************************************
export interface ReporteProgramacionesFilters
  extends ReporteResumenFilters {

  id_programacion?: number | null;

  estado?: ReporteEstadoProgramacion | null;

  page?: number | null;
  limit?: number | null;

  sort_by?: ReporteProgramacionesColumnaKey | null;
  sort_order?: 'ASC' | 'DESC' | null;
}

// *********************************************************
// 2. FILTROS APLICADOS
// No incluye paginación ni ordenamiento.
// *********************************************************
export interface ReporteProgramacionesFiltrosAplicados
  extends ReporteResumenFiltrosAplicados {

  id_programacion?: number;
  estado?: ReporteEstadoProgramacion;
}

// *********************************************************
// 3. REGISTRO DEL REPORTE
// *********************************************************
export interface ReporteProgramacionItem {
  id_programacion: number;

  id_ruta: number;
  ruta: string | null;

  id_zona: number | null;
  zona: string | null;

  id_vehiculo: number;
  placa: string | null;

  /** Fecha civil: YYYY-MM-DD. */
  fecha_programada: string;

  /** Hora: HH:mm:ss. */
  hora_inicio_programada: string;

  /** Hora: HH:mm:ss. */
  hora_fin_programada: string;

  /** Ejemplos recibidos: MANANA, TARDE. */
  turno: string;

  estado: ReporteEstadoProgramacion;

  id_usuario_creacion: number;
}

// *********************************************************
// 4. COLUMNAS
// *********************************************************
export type ReporteProgramacionesColumnaKey =
  keyof ReporteProgramacionItem;

export interface ReporteProgramacionesColumna {
  key: ReporteProgramacionesColumnaKey;
  titulo: string;
}

// *********************************************************
// 5. PAGINACIÓN
// *********************************************************
export interface ReporteProgramacionesPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// 6. ORDENAMIENTO
// *********************************************************
export interface ReporteProgramacionesOrden {
  sort_by: ReporteProgramacionesColumnaKey;
  sort_order: 'ASC' | 'DESC';
}

// *********************************************************
// 7. METADATA
// *********************************************************
export interface ReporteProgramacionesMetadata {
  zona_horaria: 'America/Lima';
  generado_por: number;

  orden: ReporteProgramacionesOrden;

  base_fecha: string;

  /** Fecha ISO del servidor. */
  generado_en: string;

  alcance: 'PAGINA';
}

// *********************************************************
// 8. DATA DEL ENDPOINT
// *********************************************************
export interface ReporteProgramacionesData {
  tipo_reporte: 'PROGRAMACIONES';

  filtros_aplicados:
  ReporteProgramacionesFiltrosAplicados;

  columnas: ReporteProgramacionesColumna[];

  items: ReporteProgramacionItem[];

  resumen:
  ReporteResumenConteos<ReporteEstadoProgramacion>;

  pagination: ReporteProgramacionesPagination;

  metadata: ReporteProgramacionesMetadata;
}

// *********************************************************
// 9. RESPUESTA
// *********************************************************
export type GetReporteProgramacionesResponse =  ApiResponse<ReporteProgramacionesData>;
