// *********************************************************
// 1. FILTROS
// *********************************************************
export interface MonitoreoOperacionFilters {
  fecha?: string | null;
  id_zona?: number | null;
  id_ruta?: number | null;
  id_vehiculo?: number | null;
  estado_programacion?: string | null;
  estado_recorrido?: string | null;
  solo_alertas?: boolean | null;
}

// *********************************************************
// 2. FILTROS APLICADOS
// *********************************************************
export interface MonitoreoOperacionFiltrosAplicados {
  fecha: string;
  id_zona: number | null;
  id_ruta: number | null;
  id_vehiculo: number | null;
  estado_programacion: string | null;
  estado_recorrido: string | null;
  solo_alertas: boolean | null;
}

// *********************************************************
// 3. RESUMEN OPERATIVO
// *********************************************************
export interface MonitoreoOperacionResumen {
  total_programaciones: number;
  programadas: number;
  asignadas: number;
  aceptadas: number;
  en_curso: number;
  pausadas: number;
  finalizadas: number;
  canceladas: number;
  con_alertas: number;
  sin_gps: number;
  cumplimiento_porcentaje: number;
}

// *********************************************************
// 4. POLÍGONO GEOJSON
// *********************************************************
export interface MonitoreoPoligonoGeoJSON {
  type: 'Polygon';
  coordinates: number[][][];
}

// *********************************************************
// 5. ZONA
// *********************************************************
export interface MonitoreoZona {
  id_zona: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  poligono_geojson: MonitoreoPoligonoGeoJSON;
  centro_latitud: string;
  centro_longitud: string;
  estado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// 6. RUTA
// *********************************************************
export interface MonitoreoRuta {
  id_ruta: number;
  nombre: string;
  zona: MonitoreoZona;
}

// *********************************************************
// 7. VEHÍCULO
// *********************************************************
export interface MonitoreoVehiculo {
  id_vehiculo: number;
  codigo: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  tipo_vehiculo: string;
  capacidad_maxima: string;
  unidad_capacidad: string;
  kilometraje: string;
  estado_operativo: string;
  observacion: string | null;
  foto_url: string | null;
  estado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// 8. RECORRIDO
// *********************************************************
export interface MonitoreoRecorrido {
  id_recorrido: number;
  estado_recorrido: string;
  fecha_hora_inicio: string;
  fecha_hora_finalizacion: string | null;
  duracion_segundos: number | null;
  distancia_recorrida_metros: number | null;
}

// *********************************************************
// 9. ÚLTIMA UBICACIÓN
// *********************************************************
export interface MonitoreoUltimaUbicacion {
  id_ultima_ubicacion: number;
  id_recorrido: number;
  id_posicion: number;
  id_usuario: number;
  latitud: string;
  longitud: string;
  precision_gps: string | null;
  altitud: string | null;
  velocidad_mps: string | null;
  rumbo: string | null;
  nivel_bateria: string | null;
  es_ubicacion_simulada: boolean;
  fecha_dispositivo: string;
  fecha_recepcion: string;
  created_at: string;
  updated_at: string;
}

// *********************************************************
// 10. ESTADO GPS
// *********************************************************
export interface MonitoreoGps {
  estado: string;
  segundos_sin_actualizar: number | null;
  fecha_ultima_posicion: string | null;
}

// *********************************************************
// 11. PROGRESO DE RECOLECCIÓN
// *********************************************************
export interface MonitoreoProgreso {
  total_puntos: number;
  atendidos: number;
  pendientes: number;
  porcentaje: number;
}

// *********************************************************
// 12. CAPACIDAD
// *********************************************************
export interface MonitoreoCapacidad {
  disponible: boolean;
  cantidad_acumulada: number;
  capacidad_maxima: number;
  unidad_medida: string | null;
  porcentaje: number;
  nivel: string;
}

// *********************************************************
// 13. CONTROL HORARIO
// *********************************************************
export interface MonitoreoControlHorario {
  inicio_programado: string;
  fin_programado: string;
  minutos_retraso_inicio: number;
}

// *********************************************************
// 14. ITEM DEL MONITOREO OPERATIVO
// *********************************************************
export interface MonitoreoOperacionItem {
  id_programacion: number;
  estado_programacion: string;
  fecha_programada: string;
  hora_inicio_programada: string;
  hora_fin_programada: string;
  turno: string;
  ruta: MonitoreoRuta;
  vehiculo: MonitoreoVehiculo;
  recorrido: MonitoreoRecorrido | null;
  ultima_ubicacion: MonitoreoUltimaUbicacion | null;
  gps: MonitoreoGps;
  progreso: MonitoreoProgreso;
  capacidad: MonitoreoCapacidad;
  control_horario: MonitoreoControlHorario;
}

// *********************************************************
// 15. DATOS DEL MONITOREO OPERATIVO
// *********************************************************
export interface MonitoreoOperacionData {
  fecha_consulta: string;
  generado_en: string;
  filtros: MonitoreoOperacionFiltrosAplicados;
  resumen: MonitoreoOperacionResumen;
  items: MonitoreoOperacionItem[];
}

// *********************************************************
// 16. RESPUESTA DEL ENDPOINT
// *********************************************************
export interface GetMonitoreoOperacionResponse {
  success: boolean;
  message: string;
  data: MonitoreoOperacionData;
}
