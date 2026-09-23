import {
  DashboardPeriodo,
  DashboardRecoleccionesResumen,
  DashboardResumenFilters,
} from './dashboard-resumen.interface';

// *********************************************************
// 1. FILTROS
// *********************************************************
export type DashboardRecoleccionesFilters =
  DashboardResumenFilters;

// *********************************************************
// 2. PERÍODO Y FILTROS APLICADOS
// *********************************************************
export interface DashboardRecoleccionesPeriodo
  extends DashboardPeriodo {
  id_zona: number | null;
  id_ruta: number | null;
  id_vehiculo: number | null;
  agrupacion: string;
}

// *********************************************************
// 3. DATOS DE INDICADORES DE RECOLECCIONES
// *********************************************************
export interface DashboardRecoleccionesData {
  periodo: DashboardRecoleccionesPeriodo;
  indicadores: DashboardRecoleccionesResumen;
}

// *********************************************************
// 4. RESPUESTA DEL ENDPOINT
// *********************************************************
export interface GetDashboardRecoleccionesResponse {
  success: boolean;
  message: string;
  data: DashboardRecoleccionesData;
}
