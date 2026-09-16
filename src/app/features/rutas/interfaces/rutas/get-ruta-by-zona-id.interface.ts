import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaData } from "./create-ruta.interface";
import { RutaVersionVigenteData } from "./get-rutas-paginated.interface";

// *********************************************************
// GEOMETRÍA DE LA RUTA
// *********************************************************
export type RutaCoordenada = [
  longitud: number,
  latitud: number,
];

export interface RutaGeometriaGeoJSON {
  type: 'LineString';
  coordinates: RutaCoordenada[];
}

// *********************************************************
// VERSIÓN COMPLETA DE LA RUTA
// *********************************************************
export interface RutaVersionDetalleData
  extends RutaVersionVigenteData {
  id_ruta: number;

  geometria_geojson: RutaGeometriaGeoJSON | null;

  fecha_vigencia_desde: string;
  fecha_vigencia_hasta: string | null;

  observacion: string | null;
  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// HORARIO DE RUTA
// *********************************************************
export interface RutaHorarioData {
  id_ruta_horario: number;
  id_ruta: number;

  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  frecuencia: string;

  fecha_vigencia_desde: string;
  fecha_vigencia_hasta: string | null;

  observacion: string | null;
  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// RUTA OBTENIDA POR ZONA
// *********************************************************
export interface RutaPorZonaData extends RutaData {
  deleted_at: string | null;

  version_vigente: RutaVersionDetalleData | null;
  horarios: RutaHorarioData[];
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type GetRutasByZonaResponse = ApiResponse<RutaPorZonaData>;
