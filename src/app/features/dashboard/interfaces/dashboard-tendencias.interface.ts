import {
  DashboardPeriodo,
  DashboardResumenFilters,
  DashboardTendencia,
} from './dashboard-resumen.interface';

// *********************************************************
// 1. FILTROS
// *********************************************************
export type DashboardTendenciasFilters =
  DashboardResumenFilters;

// *********************************************************
// 2. PERÍODO Y FILTROS APLICADOS
// *********************************************************
export interface DashboardTendenciasPeriodo
  extends DashboardPeriodo {
  id_zona: number | null;
  id_ruta: number | null;
  id_vehiculo: number | null;
  agrupacion: string;
}

// *********************************************************
// 3. DATOS DE TENDENCIAS
// *********************************************************
export interface DashboardTendenciasData {
  periodo: DashboardTendenciasPeriodo;
  agrupacion: string;
  series: DashboardTendencia[];
}

// *********************************************************
// 4. RESPUESTA DEL ENDPOINT
// *********************************************************
export interface GetDashboardTendenciasResponse {
  success: boolean;
  message: string;
  data: DashboardTendenciasData;
}
