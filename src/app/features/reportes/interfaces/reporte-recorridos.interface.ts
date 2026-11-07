import { ApiResponse } from 'src/app/core/models/api-response.model';

import {
  ReporteEstadoRecorrido,
  ReporteResumenConteos,
  ReporteResumenFilters,
  ReporteResumenFiltrosAplicados,
} from './reporte-resumen.interface';

// *********************************************************
// 1. FILTROS
// *********************************************************
export interface ReporteRecorridosFilters
  extends ReporteResumenFilters {

  id_programacion?: number | null;
  id_recorrido?: number | null;

  /** Usuario que inició el recorrido. */
  id_usuario?: number | null;

  estado?: ReporteEstadoRecorrido | null;

  page?: number | null;
  limit?: number | null;

  sort_by?: ReporteRecorridosColumnaKey | null;
  sort_order?: 'ASC' | 'DESC' | null;
}

// *********************************************************
// 2. FILTROS APLICADOS
// *********************************************************
export interface ReporteRecorridosFiltrosAplicados
  extends ReporteResumenFiltrosAplicados {

  id_programacion?: number;
  id_recorrido?: number;
  id_usuario?: number;

  estado?: ReporteEstadoRecorrido;
}

// *********************************************************
// 3. REGISTRO DEL REPORTE
// *********************************************************
export interface ReporteRecorridoItem {
  id_recorrido: number;
  id_programacion: number;

  id_ruta: number;
  ruta: string | null;

  id_zona: number | null;
  zona: string | null;

  id_vehiculo: number;
  placa: string | null;

  estado: ReporteEstadoRecorrido;

  /** Fecha ISO en UTC. */
  fecha_inicio: string;

  /** Puede ser null en recorridos todavía activos. */
  fecha_fin: string | null;

  duracion_segundos: number | null;

  /** Los DECIMAL de MySQL pueden llegar como string. */
  distancia_recorrida_metros: string | number | null;

  id_usuario_inicio: number;
  id_usuario_finalizacion: number | null;

  puntos_total: number;
  puntos_atendidos: number;
}

// *********************************************************
// 4. COLUMNAS
// *********************************************************
export type ReporteRecorridosColumnaKey =
  keyof ReporteRecorridoItem;

export interface ReporteRecorridosColumna {
  key: ReporteRecorridosColumnaKey;
  titulo: string;
}

// *********************************************************
// 5. PAGINACIÓN
// *********************************************************
export interface ReporteRecorridosPagination {
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
export interface ReporteRecorridosOrden {
  sort_by: ReporteRecorridosColumnaKey;
  sort_order: 'ASC' | 'DESC';
}

// *********************************************************
// 7. METADATA
// *********************************************************
export interface ReporteRecorridosMetadata {
  zona_horaria: 'America/Lima';
  generado_por: number;

  orden: ReporteRecorridosOrden;

  base_fecha: string;
  generado_en: string;

  alcance: 'PAGINA';
}

// *********************************************************
// 8. DATA DEL ENDPOINT
// *********************************************************
export interface ReporteRecorridosData {
  tipo_reporte: 'RECORRIDOS';

  filtros_aplicados: ReporteRecorridosFiltrosAplicados;

  columnas: ReporteRecorridosColumna[];

  items: ReporteRecorridoItem[];

  resumen: ReporteResumenConteos<ReporteEstadoRecorrido>;

  pagination: ReporteRecorridosPagination;

  metadata: ReporteRecorridosMetadata;
}

// *********************************************************
// 9. RESPUESTA
// *********************************************************
export type GetReporteRecorridosResponse = ApiResponse<ReporteRecorridosData>;
