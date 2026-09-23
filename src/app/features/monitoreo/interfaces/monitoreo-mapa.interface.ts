import {
  MonitoreoCapacidad,
  MonitoreoGps,
  MonitoreoProgreso,
  MonitoreoRuta,
  MonitoreoUltimaUbicacion,
  MonitoreoVehiculo,
} from './monitoreo-operacion.interface';

// *********************************************************
// 1. FILTROS
// *********************************************************
export interface MonitoreoMapaFilters {
  fecha?: string | null;
  id_zona?: number | null;
  id_ruta?: number | null;
  id_vehiculo?: number | null;
  estado_programacion?: string | null;
  estado_recorrido?: string | null;
}

// *********************************************************
// 2. ITEM DEL MAPA
// *********************************************************
export interface MonitoreoMapaItem {
  id_programacion: number;
  id_recorrido: number;
  estado_recorrido: string;
  ruta: MonitoreoRuta;
  vehiculo: MonitoreoVehiculo;
  ultima_ubicacion: MonitoreoUltimaUbicacion | null;
  gps: MonitoreoGps;
  progreso: MonitoreoProgreso;
  capacidad: MonitoreoCapacidad;
}

// *********************************************************
// 3. DATOS DEL MONITOREO POR MAPA
// *********************************************************
export interface MonitoreoMapaData {
  fecha_consulta: string;
  generado_en: string;
  total: number;
  items: MonitoreoMapaItem[];
}

// *********************************************************
// 4. RESPUESTA DEL ENDPOINT
// *********************************************************
export interface GetMonitoreoMapaResponse {
  success: boolean;
  message: string;
  data: MonitoreoMapaData;
}
