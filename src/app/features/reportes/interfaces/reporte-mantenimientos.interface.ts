import { ApiResponse } from 'src/app/core/models/api-response.model';

import {
  ReporteResumenConteos,
} from './reporte-resumen.interface';

// *********************************************************
// 1. TIPOS Y ESTADOS
// *********************************************************
export type ReporteTipoMantenimiento =
  | 'PREVENTIVO'
  | 'CORRECTIVO';

export type ReporteEstadoMantenimiento =
  | 'PROGRAMADO'
  | 'EN_PROCESO'
  | 'FINALIZADO'
  | 'CANCELADO';

// *********************************************************
// 2. FILTROS
// *********************************************************
export interface ReporteMantenimientosFilters {
  /** Formato YYYY-MM-DD. */
  fecha_inicio: string;

  /** Formato YYYY-MM-DD. */
  fecha_fin: string;

  id_vehiculo?: number | null;
  id_mantenimiento?: number | null;

  tipo_mantenimiento?: ReporteTipoMantenimiento | null;
  estado?: ReporteEstadoMantenimiento | null;

  page?: number | null;
  limit?: number | null;

  sort_by?: ReporteMantenimientosColumnaKey | null;
  sort_order?: 'ASC' | 'DESC' | null;
}

// *********************************************************
// 3. FILTROS APLICADOS
// *********************************************************
export interface ReporteMantenimientosFiltrosAplicados {
  fecha_inicio: string;
  fecha_fin: string;

  id_vehiculo?: number;
  id_mantenimiento?: number;

  tipo_mantenimiento?: ReporteTipoMantenimiento;
  estado?: ReporteEstadoMantenimiento;
}

// *********************************************************
// 4. REGISTRO DEL REPORTE
// *********************************************************
export interface ReporteMantenimientoItem {
  id_mantenimiento: number;
  id_vehiculo: number;

  placa: string | null;

  tipo_mantenimiento: ReporteTipoMantenimiento;
  estado: ReporteEstadoMantenimiento;

  /** Fechas ISO de la intervención programada. */
  fecha_inicio_programada: string;
  fecha_fin_programada: string;

  /** Fechas ISO; pueden faltar mientras no se ejecute. */
  fecha_inicio_real: string | null;
  fecha_fin_real: string | null;

  /** DECIMAL de MySQL, por ejemplo "150.00". */
  costo_total: string | null;

  /**
   * Resultado de la intervención:
   * 1: operativo.
   * 0: no operativo.
   * null: resultado sin registrar.
   */
  vehiculo_operativo: 0 | 1 | null;
}

// *********************************************************
// 5. COLUMNAS
// *********************************************************
export type ReporteMantenimientosColumnaKey =
  keyof ReporteMantenimientoItem;

export interface ReporteMantenimientosColumna {
  key: ReporteMantenimientosColumnaKey;
  titulo: string;
}

// *********************************************************
// 6. PAGINACIÓN
// *********************************************************
export interface ReporteMantenimientosPagination {
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
export interface ReporteMantenimientosOrden {
  sort_by: ReporteMantenimientosColumnaKey;
  sort_order: 'ASC' | 'DESC';
}

// *********************************************************
// 8. METADATA
// *********************************************************
export interface ReporteMantenimientosMetadata {
  zona_horaria: 'America/Lima';
  generado_por: number;

  orden: ReporteMantenimientosOrden;

  base_fecha: string;
  generado_en: string;

  alcance: 'PAGINA';
}

// *********************************************************
// 9. DATA DEL ENDPOINT
// *********************************************************
export interface ReporteMantenimientosData {
  tipo_reporte: 'MANTENIMIENTOS';

  filtros_aplicados: ReporteMantenimientosFiltrosAplicados;

  columnas: ReporteMantenimientosColumna[];

  items: ReporteMantenimientoItem[];

  resumen: ReporteResumenConteos<ReporteEstadoMantenimiento>;

  pagination: ReporteMantenimientosPagination;

  metadata: ReporteMantenimientosMetadata;
}

// *********************************************************
// 10. RESPUESTA
// *********************************************************
export type GetReporteMantenimientosResponse = ApiResponse<ReporteMantenimientosData>;
