// *********************************************************
// COORDENADAS Y POLÍGONO
// *********************************************************

import { ApiResponse } from "src/app/core/models/api-response.model";

// GeoJSON utiliza el orden: longitud, latitud.
export type ZonaCoordenada = [
  longitud: number,
  latitud: number,
];

export interface ZonaPoligonoGeoJSON {
  type: 'Polygon';
  coordinates: ZonaCoordenada[][];
}

// *********************************************************
// ZONA
// *********************************************************
export interface ZonaData {
  id_zona: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;

  poligono_geojson: ZonaPoligonoGeoJSON | null;

  // El backend devuelve los DECIMAL como cadenas.
  centro_latitud: string | null;
  centro_longitud: string | null;

  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// DATOS PAGINADOS
// *********************************************************
export interface ZonasPaginadasData {
  items: ZonaData[];

  total: number;
  page: number;
  limit: number;
  total_pages: number;

  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// FILTROS
// *********************************************************
export interface ZonasPaginadasFilters {
  page?: number;
  limit?: number;
  search?: string;
  estado?: boolean;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export type GetZonasPaginatedResponse = ApiResponse<ZonasPaginadasData>;
