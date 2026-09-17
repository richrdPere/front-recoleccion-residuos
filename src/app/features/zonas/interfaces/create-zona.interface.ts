// *********************************************************
// REQUEST PARA CREAR ZONA

import { ApiResponse } from "src/app/core/models/api-response.model";
import { ZonaData, ZonaPoligonoGeoJSON } from "./get-zonas-paginated.interface";

// *********************************************************
export interface CreateZonaRequest {
  codigo: string;
  nombre: string;
  descripcion: string;
  color: string;

  poligono_geojson: ZonaPoligonoGeoJSON;

  centro_latitud: number;
  centro_longitud: number;
}

// *********************************************************
// DATOS DE LA ZONA CREADA
// *********************************************************
export interface CreateZonaData
  extends Omit<
    ZonaData,
    'centro_latitud' | 'centro_longitud' | 'deleted_at'
  > {
  centro_latitud: number;
  centro_longitud: number;
}

// *********************************************************
// RESPUESTA DE CREACIÓN
// *********************************************************
export type CreateZonaResponse = ApiResponse<CreateZonaData>;
