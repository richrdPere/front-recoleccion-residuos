import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaData } from "./create-ruta.interface";

// *********************************************************
// ZONA ASOCIADA
// *********************************************************
export interface RutaZonaData {
  id_zona: number;
  codigo: string;
  nombre: string;
  color: string | null;
  estado: boolean;
}

// *********************************************************
// VERSIÓN VIGENTE
// *********************************************************
export interface RutaVersionVigenteData {
  id_ruta_version: number;
  numero_version: number;

  // El backend devuelve el decimal como cadena.
  distancia_estimada_km: string;
  duracion_estimada_min: number;

  vigente: boolean;
}

// *********************************************************
// ITEM DEL PAGINADO
// *********************************************************
export interface RutaPaginadaItem extends RutaData {
  deleted_at: string | null;

  zona: RutaZonaData | null;
  version_vigente: RutaVersionVigenteData | null;
}

// *********************************************************
// DATOS PAGINADOS
// *********************************************************
export interface RutasPaginadasData {
  items: RutaPaginadaItem[];

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
export interface RutasPaginadasFilters {
  page?: number;
  limit?: number;
  search?: string;

  id_zona?: number;
  estado?: boolean;
  estado_ruta?: string;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type GetRutasPaginatedResponse = ApiResponse<RutasPaginadasData>;
