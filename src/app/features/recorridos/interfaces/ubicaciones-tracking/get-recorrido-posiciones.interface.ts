// *********************************************************
// QUERY PARAMS

import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
export interface GetRecorridoPosicionesParams {
  page?: number;
  limit?: number;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
  solo_validas?: boolean;
}

// *********************************************************
// DATA PAGINADA
// *********************************************************
export interface RecorridoPosicionesData {
  items: RecorridoPosicionItem[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// POSICIÓN
// *********************************************************
export interface RecorridoPosicionItem {
  id_posicion: number;
  id_recorrido: number;

  latitud: string;
  longitud: string;
  precision_gps: string | null;
  altitud: string | null;
  velocidad_mps: string | null;
  rumbo: string | null;
  nivel_bateria: string | null;

  es_ubicacion_simulada: boolean;
  fecha_dispositivo: string;
  fecha_recepcion: string;

  es_valida: boolean;
  motivo_invalidez: string | null;
  origen: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetRecorridoPosicionesResponse = ApiResponse<RecorridoPosicionesData>;
