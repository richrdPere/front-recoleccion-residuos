// Ajusta la ruta según tu estructura.

import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaGeometriaGeoJSON, RutaVersionDetalleData } from "../rutas";


// *********************************************************
// REQUEST PARA ACTUALIZAR VERSIÓN
// *********************************************************
export interface UpdateRutaVersionRequest {
  geometria_geojson?: RutaGeometriaGeoJSON;

  distancia_estimada_km?: number;
  duracion_estimada_min?: number;

  fecha_vigencia_desde?: string;
  fecha_vigencia_hasta?: string | null;

  observacion?: string | null;
}

// *********************************************************
// VERSIÓN ACTUALIZADA
// *********************************************************
export interface UpdateRutaVersionData
  extends Omit<
    RutaVersionDetalleData,
    'distancia_estimada_km'
  > {
  distancia_estimada_km: number | string;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type UpdateRutaVersionResponse = ApiResponse<UpdateRutaVersionData[]>;
