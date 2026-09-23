import {
  MonitoreoCapacidad,
  MonitoreoGps,
  MonitoreoProgreso,
  MonitoreoRuta,
  MonitoreoUltimaUbicacion,
  MonitoreoVehiculo,
} from './monitoreo-operacion.interface';

// *********************************************************
// 1. TIPOS DE PUNTO
// *********************************************************
export type MonitoreoTipoPunto =
  | 'INICIO'
  | 'RECOLECCION'
  | 'DESCARGA'
  | 'FINAL'
  | 'REFERENCIA';

// *********************************************************
// 2. USUARIO RESUMIDO
// *********************************************************
export interface MonitoreoUsuarioResumen {
  id_usuario: number;
  username: string;
}

// *********************************************************
// 3. RUTA DETALLADA
// *********************************************************
export interface MonitoreoRutaDetalle
  extends MonitoreoRuta {
  id_zona: number;
  codigo: string;
  descripcion: string | null;
  color: string;
  estado_ruta: string;
  estado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// 4. GEOMETRÍA DE LA RUTA
// *********************************************************
export interface MonitoreoLineStringGeoJSON {
  type: 'LineString';
  coordinates: number[][];
}

// *********************************************************
// 5. PUNTO DE RUTA
// *********************************************************
export interface MonitoreoRutaPunto {
  id_ruta_punto: number;
  id_ruta_version: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo_punto: MonitoreoTipoPunto;
  latitud: string;
  longitud: string;
  orden: number;
  radio_atencion_metros: number;
  tiempo_estimado_min: number;
  obligatorio: boolean;
  estado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// 6. VERSIÓN DE RUTA
// *********************************************************
export interface MonitoreoRutaVersion {
  id_ruta_version: number;
  id_ruta: number;
  numero_version: number;
  geometria_geojson: MonitoreoLineStringGeoJSON;
  distancia_estimada_km: string;
  duracion_estimada_min: number;
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta: string | null;
  vigente: boolean;
  observacion: string | null;
  estado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  puntos: MonitoreoRutaPunto[];
}

// *********************************************************
// 7. PERSONAL OPERATIVO
// *********************************************************
export interface MonitoreoPersonalOperativo {
  id_personal: number;
  id_usuario: number;
  codigo_empleado: string;
  fecha_ingreso: string;
  fecha_salida: string | null;
  tipo_contrato: string;
  turno_preferente: string;
  estado_laboral: string;
  observacion: string | null;
  estado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// 8. PERSONAL ASIGNADO
// *********************************************************
export interface MonitoreoPersonalAsignado {
  id_programacion_personal: number;
  id_programacion: number;
  id_personal: number;
  funcion: 'CONDUCTOR' | 'RECOLECTOR' | 'SUPERVISOR';
  es_principal: boolean;
  estado_asignacion: string;
  fecha_respuesta: string | null;
  observacion: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  personal: MonitoreoPersonalOperativo;
}

// *********************************************************
// 9. PROGRAMACIÓN DETALLADA
// *********************************************************
export interface MonitoreoProgramacionDetalle {
  id_programacion: number;
  id_ruta: number;
  id_ruta_version: number;
  id_vehiculo: number;
  id_usuario_creacion: number;
  fecha_programada: string;
  hora_inicio_programada: string;
  hora_fin_programada: string;
  turno: string;
  estado_programacion: string;
  observacion: string | null;
  motivo_cancelacion: string | null;
  fecha_cancelacion: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  ruta: MonitoreoRutaDetalle;
  version_ruta: MonitoreoRutaVersion;
  vehiculo: MonitoreoVehiculo;
  personal_asignado: MonitoreoPersonalAsignado[];
}

// *********************************************************
// 10. RECOLECCIÓN
// *********************************************************
export interface MonitoreoRecoleccion {
  id_recoleccion: number;
  id_recorrido: number;
  id_ruta_punto: number;
  id_usuario: number;
  fecha_dispositivo: string;
  fecha_recepcion: string;
  latitud: string;
  longitud: string;
  precision_gps: string | null;
  distancia_punto_metros: string | null;
  dentro_radio_permitido: boolean;
  cantidad_recolectada: string;
  unidad_medida: string;
  observacion: string | null;
  clave_idempotencia: string;
  origen: string;
  estado_recoleccion: string;
  motivo_anulacion: string | null;
  fecha_anulacion: string | null;
  id_usuario_anulacion: number | null;
  created_at: string;
  updated_at: string;
  punto_ruta: MonitoreoRutaPunto;
}

// *********************************************************
// 11. EVENTO DEL RECORRIDO
// *********************************************************
export interface MonitoreoRecorridoEvento {
  id_recorrido_evento: number;
  id_recorrido: number;
  id_usuario: number;
  tipo_evento: string;
  fecha_evento: string;
  fecha_recepcion: string;
  latitud: string | null;
  longitud: string | null;
  precision_gps: string | null;
  observacion: string | null;
  clave_idempotencia: string;

  // El ejemplo solo devuelve null.
  // Se usa unknown hasta conocer la estructura de los datos.
  datos: unknown;

  origen: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  usuario: MonitoreoUsuarioResumen;
}

// *********************************************************
// 12. ALERTA DEL RECORRIDO
// *********************************************************
export interface MonitoreoRecorridoAlerta {
  id_programacion: number;
  id_recorrido: number;
  ruta: MonitoreoRuta;
  vehiculo: MonitoreoVehiculo;
  codigo: string;
  nivel: string;
  mensaje: string;
  valor: number;
  unidad: string;
}

// *********************************************************
// 13. DETALLE DEL RECORRIDO
// *********************************************************
export interface MonitoreoRecorridoDetalleData {
  id_recorrido: number;
  id_programacion: number;
  id_usuario_inicio: number;
  id_usuario_finalizacion: number | null;
  estado_recorrido: string;

  fecha_hora_inicio: string;
  fecha_hora_finalizacion: string | null;

  latitud_inicio: string;
  longitud_inicio: string;
  precision_inicio: string | null;

  latitud_finalizacion: string | null;
  longitud_finalizacion: string | null;
  precision_finalizacion: string | null;

  kilometraje_inicio: string | null;
  kilometraje_final: string | null;
  distancia_recorrida_metros: number | null;
  duracion_segundos: number | null;

  observacion_inicio: string | null;
  observacion_finalizacion: string | null;
  motivo_cancelacion: string | null;

  estado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  programacion: MonitoreoProgramacionDetalle;
  ultima_ubicacion: MonitoreoUltimaUbicacion | null;

  recolecciones: MonitoreoRecoleccion[];
  eventos: MonitoreoRecorridoEvento[];

  usuario_inicio: MonitoreoUsuarioResumen;
  usuario_finalizacion: MonitoreoUsuarioResumen | null;

  gps: MonitoreoGps;
  progreso: MonitoreoProgreso;
  capacidad: MonitoreoCapacidad;
  alertas: MonitoreoRecorridoAlerta[];
}

// *********************************************************
// 14. RESPUESTA DEL ENDPOINT
// *********************************************************
export interface GetMonitoreoRecorridoDetalleResponse {
  success: boolean;
  message: string;
  data: MonitoreoRecorridoDetalleData;
}
