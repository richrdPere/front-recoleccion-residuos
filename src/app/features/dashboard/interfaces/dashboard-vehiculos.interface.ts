import {
  DashboardPeriodo,
  DashboardResumenFilters,
  DashboardVehiculosResumen,
} from './dashboard-resumen.interface';

// *********************************************************
// 1. FILTROS
// *********************************************************
export type DashboardVehiculosFilters =
  DashboardResumenFilters;

// *********************************************************
// 2. PERÍODO Y FILTROS APLICADOS
// *********************************************************
export interface DashboardVehiculosPeriodo
  extends DashboardPeriodo {
  id_zona: number | null;
  id_ruta: number | null;
  id_vehiculo: number | null;
  agrupacion: string;
}

// *********************************************************
// 3. DATOS DE INDICADORES DE VEHÍCULOS
// *********************************************************
export interface DashboardVehiculosData {
  periodo: DashboardVehiculosPeriodo;
  indicadores: DashboardVehiculosResumen;
}

// *********************************************************
// 4. RESPUESTA DEL ENDPOINT
// *********************************************************
export interface GetDashboardVehiculosResponse {
  success: boolean;
  message: string;
  data: DashboardVehiculosData;
}
