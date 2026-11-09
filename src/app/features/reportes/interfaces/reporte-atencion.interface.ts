import { ApiResponse } from 'src/app/core/models/api-response.model';

import {
  ReporteEstadoAtencion,
  ReporteResumenConteos,
  ReporteResumenFilters,
  ReporteResumenFiltrosAplicados,
} from './reporte-resumen.interface';

// *********************************************************
// 1. FILTROS
// *********************************************************
export interface ReporteAtencionFilters
  extends ReporteResumenFilters {

  id_programacion?: number | null;
  id_recorrido?: number | null;

  /** ID del punto de ruta. El filtro del backend es id_punto. */
  id_punto?: number | null;

  /** Usuario que registró la atención. */
  id_usuario?: number | null;

  estado?: ReporteEstadoAtencion | null;

  page?: number | null;
  limit?: number | null;

  sort_by?: ReporteAtencionColumnaKey | null;
  sort_order?: 'ASC' | 'DESC' | null;
}

// *********************************************************
// 2. FILTROS APLICADOS
// *********************************************************
export interface ReporteAtencionFiltrosAplicados
  extends ReporteResumenFiltrosAplicados {

  id_programacion?: number;
  id_recorrido?: number;
  id_punto?: number;
  id_usuario?: number;

  estado?: ReporteEstadoAtencion;
}

// *********************************************************
// 3. REGISTRO DEL REPORTE
// *********************************************************
export interface ReporteAtencionItem {
  id_recorrido: number;
  id_programacion: number;

  id_ruta: number;
  ruta: string | null;

  id_zona: number | null;
  zona: string | null;

  id_vehiculo: number;
  placa: string | null;

  id_ruta_punto: number;
  punto: string;
  orden: number;

  /** 1: obligatorio. 0: opcional. */
  obligatorio: 0 | 1;

  estado: ReporteEstadoAtencion;

  /** Sin registro asociado cuando el punto está pendiente. */
  id_recoleccion: number | null;

  /** Responsable de registrar la atención. */
  id_usuario: number | null;

  /** Fecha ISO de captura en el dispositivo. */
  fecha_dispositivo: string | null;

  /** Fecha ISO de recepción en el servidor. */
  fecha_recepcion: string | null;

  /** Los DECIMAL de MySQL pueden llegar como texto. */
  latitud: string | number | null;
  longitud: string | number | null;

  responsable: string | null;

  precision_gps: string | number | null;

  distancia_punto_metros: string | number | null;

  dentro_radio_permitido: boolean | 0 | 1 | null;

  motivo_omision: string | null;

  observacion: string | null;
}

// *********************************************************
// 4. COLUMNAS
// *********************************************************
export type ReporteAtencionColumnaKey =
  keyof ReporteAtencionItem;

export interface ReporteAtencionColumna {
  key: ReporteAtencionColumnaKey;
  titulo: string;
}

// *********************************************************
// 5. PAGINACIÓN
// *********************************************************
export interface ReporteAtencionPagination {
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
export interface ReporteAtencionOrden {
  sort_by: ReporteAtencionColumnaKey;
  sort_order: 'ASC' | 'DESC';
}

// *********************************************************
// 7. METADATA
// *********************************************************
export interface ReporteAtencionMetadata {
  zona_horaria: 'America/Lima';
  generado_por: number;

  orden: ReporteAtencionOrden;

  base_fecha: string;
  generado_en: string;

  alcance: 'PAGINA';
}

// *********************************************************
// 8. DATA DEL ENDPOINT
// *********************************************************
export interface ReporteAtencionData {
  tipo_reporte: 'ATENCION_PUNTOS';

  filtros_aplicados: ReporteAtencionFiltrosAplicados;

  columnas: ReporteAtencionColumna[];

  items: ReporteAtencionItem[];

  resumen: ReporteResumenConteos<ReporteEstadoAtencion>;

  pagination: ReporteAtencionPagination;

  metadata: ReporteAtencionMetadata;
}

// *********************************************************
// 9. RESPUESTA
// *********************************************************
export type GetReporteAtencionResponse = ApiResponse<ReporteAtencionData>;
