import { ApiResponse } from 'src/app/core/models/api-response.model';

import {
  ReporteResumenConteos,
  ReporteResumenFilters,
  ReporteResumenFiltrosAplicados,
} from './reporte-resumen.interface';

// *********************************************************
// 1. ESTADO OPERATIVO DEL VEHÍCULO
// *********************************************************
export type ReporteEstadoVehiculo =
  | 'DISPONIBLE'
  | 'ASIGNADO'
  | 'EN_RUTA'
  | 'EN_MANTENIMIENTO'
  | 'FUERA_DE_SERVICIO';

// *********************************************************
// 2. FILTROS
// *********************************************************
export interface ReporteVehiculosFilters
  extends ReporteResumenFilters {

  id_programacion?: number | null;

  /** Estado operativo actual del vehículo. */
  estado?: ReporteEstadoVehiculo | null;

  page?: number | null;
  limit?: number | null;

  sort_by?: ReporteVehiculosColumnaKey | null;
  sort_order?: 'ASC' | 'DESC' | null;
}

// *********************************************************
// 3. FILTROS APLICADOS
// *********************************************************
export interface ReporteVehiculosFiltrosAplicados
  extends ReporteResumenFiltrosAplicados {

  id_programacion?: number;
  estado?: ReporteEstadoVehiculo;
}

// *********************************************************
// 4. REGISTRO DEL REPORTE
// *********************************************************
export interface ReporteVehiculoItem {
  id_vehiculo: number;
  placa: string | null;

  /** Estado actual; no representa el estado histórico. */
  estado: ReporteEstadoVehiculo | null;

  /** COUNT de recorridos iniciados dentro del período. */
  recorridos: number;

  /** SUM de recorridos finalizados, enviada por MySQL. */
  finalizados: string;

  /** SUM; null cuando todos los valores son desconocidos. */
  duracion_segundos: string | null;

  /** SUM de distancias registradas; no asumir cero si es null. */
  distancia_recorrida_metros: string | null;
}

// *********************************************************
// 5. COLUMNAS
// *********************************************************
export type ReporteVehiculosColumnaKey =
  keyof ReporteVehiculoItem;

export interface ReporteVehiculosColumna {
  key: ReporteVehiculosColumnaKey;
  titulo: string;
}

// *********************************************************
// 6. PAGINACIÓN
// *********************************************************
export interface ReporteVehiculosPagination {
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
export interface ReporteVehiculosOrden {
  sort_by: ReporteVehiculosColumnaKey;
  sort_order: 'ASC' | 'DESC';
}

// *********************************************************
// 8. METADATA
// *********************************************************
export interface ReporteVehiculosMetadata {
  zona_horaria: 'America/Lima';
  generado_por: number;

  orden: ReporteVehiculosOrden;

  base_fecha: string;
  generado_en: string;

  alcance: 'PAGINA';
}

// *********************************************************
// 9. DATA DEL ENDPOINT
// *********************************************************
export interface ReporteVehiculosData {
  tipo_reporte: 'VEHICULOS';

  filtros_aplicados: ReporteVehiculosFiltrosAplicados;

  columnas: ReporteVehiculosColumna[];

  items: ReporteVehiculoItem[];

  resumen: ReporteResumenConteos<ReporteEstadoVehiculo | 'SIN_DATOS'>;

  pagination: ReporteVehiculosPagination;

  metadata: ReporteVehiculosMetadata;
}

// *********************************************************
// 10. RESPUESTA
// *********************************************************
export type GetReporteVehiculosResponse = ApiResponse<ReporteVehiculosData>;
