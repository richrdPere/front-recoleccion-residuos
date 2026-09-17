// *********************************************************
// REQUEST PARA ACTUALIZAR ZONA

import { ApiResponse } from "src/app/core/models/api-response.model";
import { ZonaData, ZonaPoligonoGeoJSON } from "./get-zonas-paginated.interface";

// *********************************************************
export interface UpdateZonaRequest {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  color?: string;

  poligono_geojson?: ZonaPoligonoGeoJSON;

  centro_latitud?: number;
  centro_longitud?: number;
}

// *********************************************************
// DATOS DE LA ZONA ACTUALIZADA
// *********************************************************
export interface UpdateZonaData
  extends Omit<
    ZonaData,
    'centro_latitud' | 'centro_longitud' | 'deleted_at'
  > {
  centro_latitud: string | number | null;
  centro_longitud: string | number | null;
  deleted_at?: string | null;
}

// *********************************************************
// RESPUESTA DE ACTUALIZACIÓN
// *********************************************************
export type UpdateZonaResponse = ApiResponse<UpdateZonaData>;
