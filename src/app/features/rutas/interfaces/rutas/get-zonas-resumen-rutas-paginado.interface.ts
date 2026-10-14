// *********************************************************
// TIPOS
// *********************************************************

import { ZonaPoligonoGeoJSON } from "src/app/features/zonas/interfaces";

// BIGINT puede llegar como número o cadena.
export type ZonaResumenRutasIdentificador = number | string;

export type ZonasResumenRutasSortBy =
  | 'id_zona'
  | 'codigo'
  | 'nombre'
  | 'estado'
  | 'created_at'
  | 'updated_at';

export type ZonasResumenRutasSortOrder = 'ASC' | 'DESC';

// *********************************************************
// FILTROS DE LA SOLICITUD — QUERY PARAMS
// *********************************************************

export interface ZonasResumenRutasPaginadasFilters {
  page?: number;
  limit?: number;
  search?: string;
  estado?: boolean;
  sort_by?: ZonasResumenRutasSortBy;
  sort_order?: ZonasResumenRutasSortOrder;
}

// *********************************************************
// RESUMEN DE RUTAS POR ZONA
// *********************************************************

export interface ZonaResumenRutasData {
  cantidad_rutas: number;
  rutas_activas: number;
  rutas_borrador: number;
  rutas_inactivas: number;
  rutas_habilitadas: number;
  rutas_deshabilitadas: number;
  rutas_operativas: number;
  ultima_actualizacion_ruta: string | null;
}

// *********************************************************
// ZONA CON RESUMEN DE RUTAS
// *********************************************************

export interface ZonaConResumenRutasData {
  id_zona: ZonaResumenRutasIdentificador;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string;

  // Poligono
  poligono_geojson: ZonaPoligonoGeoJSON | null;

  // Los campos DECIMAL pueden llegar como cadenas.
  centro_latitud: number | string | null;
  centro_longitud: number | string | null;

  estado: boolean;
  created_at: string;
  updated_at: string;

  resumen_rutas: ZonaResumenRutasData;
}

// *********************************************************
// PAGINACIÓN
// *********************************************************

export interface ZonasResumenRutasPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// DATOS DE LA RESPUESTA
// *********************************************************

export interface GetZonasResumenRutasPaginadasData {
  items: ZonaConResumenRutasData[];
  pagination: ZonasResumenRutasPagination;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export interface GetZonasResumenRutasPaginadasResponse {
  success: boolean;
  message: string;
  data: GetZonasResumenRutasPaginadasData;
}
