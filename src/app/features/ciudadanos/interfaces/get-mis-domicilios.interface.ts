import { DomicilioCiudadanoData } from "./create-domicilio.interface";

// *********************************************************
// QUERY PARAMS
// *********************************************************
export interface GetMisDomiciliosParams {
  incluir_inactivos?: boolean;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface GetMisDomiciliosResponse {
  success: boolean;
  message: string;
  data: MiDomicilioData[];
}

// *********************************************************
// DOMICILIO DEL LISTADO
// *********************************************************
export interface MiDomicilioData
  extends Omit<
    DomicilioCiudadanoData,
    'latitud' | 'longitud' | 'precision_ubicacion'
  > {
  latitud: string;
  longitud: string;
  precision_ubicacion: string | null;

  fecha_validacion: string | null;
  id_usuario_validacion: number | null;
  deleted_at: string | null;

  zona: DomicilioZonaData | null;

  // Su estructura queda pendiente hasta contar con una respuesta
  // que incluya estas asociaciones.
  ruta: Record<string, unknown> | null;
  usuario_validacion: Record<string, unknown> | null;
}

// *********************************************************
// ZONA
// *********************************************************
export interface DomicilioZonaData {
  id_zona: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;

  poligono_geojson: DomicilioPolygonGeoJson | null;
  centro_latitud: string | null;
  centro_longitud: string | null;

  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// GEOJSON
// Coordenadas en orden [longitud, latitud].
// *********************************************************
export interface DomicilioPolygonGeoJson {
  type: 'Polygon';
  coordinates: number[][][];
}
