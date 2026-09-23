import {
  MonitoreoRuta,
  MonitoreoVehiculo,
} from './monitoreo-operacion.interface';

// *********************************************************
// 1. FILTROS
// *********************************************************
export interface MonitoreoAlertasFilters {
  fecha?: string | null;
  id_zona?: number | null;
  id_ruta?: number | null;
  id_vehiculo?: number | null;
  estado_programacion?: string | null;
  estado_recorrido?: string | null;

  // Valores observados: CRITICA y ADVERTENCIA.
  // Mantener string hasta confirmar el catálogo completo.
  nivel?: string | null;

  page?: number | null;
  limit?: number | null;
}

// *********************************************************
// 2. RESUMEN DE ALERTAS
// *********************************************************
export interface MonitoreoAlertasResumen {
  total: number;
  criticas: number;
  advertencias: number;
  informativas: number;
}

// *********************************************************
// 3. ALERTA OPERATIVA
// *********************************************************
export interface MonitoreoAlertaOperativa {
  id_programacion: number;
  id_recorrido: number | null;
  ruta: MonitoreoRuta;
  vehiculo: MonitoreoVehiculo;
  codigo: string;
  nivel: string;
  mensaje: string;
  valor: number;
  unidad: string;
}

// *********************************************************
// 4. PAGINACIÓN
// *********************************************************
export interface MonitoreoAlertasPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// *********************************************************
// 5. DATOS DE ALERTAS OPERATIVAS
// *********************************************************
export interface MonitoreoAlertasData {
  resumen: MonitoreoAlertasResumen;
  items: MonitoreoAlertaOperativa[];
  pagination: MonitoreoAlertasPagination;
}

// *********************************************************
// 6. RESPUESTA DEL ENDPOINT
// *********************************************************
export interface GetMonitoreoAlertasResponse {
  success: boolean;
  message: string;
  data: MonitoreoAlertasData;
}
