import {
  DashboardPeriodo,
  DashboardRendimientoRuta,
  DashboardResumenFilters,
} from './dashboard-resumen.interface';

// *********************************************************
// 1. DIRECCIÓN DE ORDENAMIENTO
// *********************************************************
export type DashboardOrderDirection = 'ASC' | 'DESC';

// *********************************************************
// 2. FILTROS
// *********************************************************
export interface DashboardRendimientoRutasFilters
  extends DashboardResumenFilters {
  page?: number | null;
  limit?: number | null;

  // Campo confirmado: 'cumplimiento_porcentaje'.
  // Mantener string hasta conocer todos los campos
  // permitidos por las validaciones del backend.
  order_by?: string | null;

  order_direction?: DashboardOrderDirection | null;
}

// *********************************************************
// 3. PERÍODO Y FILTROS APLICADOS
// *********************************************************
export interface DashboardRendimientoRutasPeriodo
  extends DashboardPeriodo {
  id_zona: number | null;
  id_ruta: number | null;
  id_vehiculo: number | null;
  agrupacion: string;
}

// *********************************************************
// 4. PAGINACIÓN
// *********************************************************
export interface DashboardRendimientoRutasPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// *********************************************************
// 5. DATOS DEL RENDIMIENTO DE RUTAS
// *********************************************************
export interface DashboardRendimientoRutasData {
  periodo: DashboardRendimientoRutasPeriodo;
  items: DashboardRendimientoRuta[];
  pagination: DashboardRendimientoRutasPagination;
}

// *********************************************************
// 6. RESPUESTA DEL ENDPOINT
// *********************************************************
export interface GetDashboardRendimientoRutasResponse {
  success: boolean;
  message: string;
  data: DashboardRendimientoRutasData;
}
