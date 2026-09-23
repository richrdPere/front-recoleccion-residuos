import {
  DashboardPeriodo,
  DashboardProgramacionesResumen,
  DashboardResumenFilters,
} from './dashboard-resumen.interface';

// *********************************************************
// 1. FILTROS
// *********************************************************
export type DashboardProgramacionesFilters =
  DashboardResumenFilters;

// *********************************************************
// 2. PERÍODO Y FILTROS APLICADOS
// *********************************************************
export interface DashboardProgramacionesPeriodo
  extends DashboardPeriodo {
  id_zona: number | null;
  id_ruta: number | null;
  id_vehiculo: number | null;
  agrupacion: string;
}

// *********************************************************
// 3. DATOS DE INDICADORES DE PROGRAMACIONES
// *********************************************************
export interface DashboardProgramacionesData {
  periodo: DashboardProgramacionesPeriodo;
  indicadores: DashboardProgramacionesResumen;
}

// *********************************************************
// 4. RESPUESTA DEL ENDPOINT
// *********************************************************
export interface GetDashboardProgramacionesResponse {
  success: boolean;
  message: string;
  data: DashboardProgramacionesData;
}
