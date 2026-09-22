import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// RECORRIDO ACTIVO
// *********************************************************
export interface VehiculoActivoTrackingData {
  id_recorrido: number;
  id_programacion: number;
  estado_recorrido: string;
  fecha_hora_inicio: string;

  // Contempla recorridos que aún no tienen posición GPS.
  ultima_ubicacion: VehiculoActivoUbicacion | null;

  programacion: VehiculoActivoProgramacion;
}

// *********************************************************
// ÚLTIMA UBICACIÓN
// *********************************************************
export interface VehiculoActivoUbicacion {
  id_ultima_ubicacion: number;
  id_posicion: number;

  latitud: string;
  longitud: string;
  precision_gps: string | null;
  velocidad_mps: string | null;
  rumbo: string | null;
  nivel_bateria: string | null;

  fecha_dispositivo: string;
  fecha_recepcion: string;
  updated_at: string;
}

// *********************************************************
// PROGRAMACIÓN
// *********************************************************
export interface VehiculoActivoProgramacion {
  id_programacion: number;
  fecha_programada: string;
  hora_inicio_programada: string;
  hora_fin_programada: string;
  estado_programacion: string;

  vehiculo: VehiculoActivoVehiculo;
  ruta: VehiculoActivoRuta;
}

// *********************************************************
// VEHÍCULO
// *********************************************************
export interface VehiculoActivoVehiculo {
  id_vehiculo: number;
  codigo: string;
  placa: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  color: string | null;

  tipo_vehiculo: string;
  capacidad_maxima: string | null;
  unidad_capacidad: string;
  kilometraje: string | null;
  estado_operativo: string;

  observacion: string | null;
  foto_url: string | null;
  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// RUTA
// *********************************************************
export interface VehiculoActivoRuta {
  id_ruta: number;
  id_zona: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  estado_ruta: string;
  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  zona: VehiculoActivoZona;
}

// *********************************************************
// ZONA
// *********************************************************
export interface VehiculoActivoZona {
  id_zona: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;

  poligono_geojson: TrackingPolygonGeoJson | null;
  centro_latitud: string | null;
  centro_longitud: string | null;

  estado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// GEOMETRÍA GEOJSON
// Coordenadas en orden [longitud, latitud].
// *********************************************************
export interface TrackingPolygonGeoJson {
  type: 'Polygon';
  coordinates: number[][][];
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetVehiculosActivosResponse = ApiResponse<VehiculoActivoTrackingData[]>;
