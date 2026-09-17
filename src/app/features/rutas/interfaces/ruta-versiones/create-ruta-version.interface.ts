// Ajusta la ruta según tu estructura.
import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaGeometriaGeoJSON } from "../rutas";


// *********************************************************
// REQUEST PARA CREAR VERSIÓN
// *********************************************************
export interface CreateRutaVersionRequest {
  geometria_geojson: RutaGeometriaGeoJSON;

  distancia_estimada_km: number;
  duracion_estimada_min: number;

  // Formato: YYYY-MM-DD.
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta: string | null;

  observacion: string | null;
  vigente: boolean;
}

// *********************************************************
// VERSIÓN CREADA
// *********************************************************
export interface CreateRutaVersionData {
  id_ruta_version: number;
  id_ruta: number;
  numero_version: number;

  geometria_geojson: RutaGeometriaGeoJSON;

  distancia_estimada_km: number;
  duracion_estimada_min: number;

  fecha_vigencia_desde: string;
  fecha_vigencia_hasta: string | null;
  observacion: string | null;

  vigente: boolean;
  estado: boolean;

  created_at: string;
  updated_at: string;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type CreateRutaVersionResponse = ApiResponse<CreateRutaVersionData>;
