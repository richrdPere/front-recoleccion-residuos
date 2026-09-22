import { ApiResponse } from "src/app/core/models/api-response.model";

export interface UltimaUbicacionRecorridoData {
  id_ultima_ubicacion: number;
  id_recorrido: number;
  id_posicion: number;
  id_usuario: number;

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
  created_at: string;
  updated_at: string;

  usuario: UltimaUbicacionUsuario;
}

export interface UltimaUbicacionUsuario {
  id_usuario: number;
  username: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetUltimaUbicacionResponse = ApiResponse<UltimaUbicacionRecorridoData>;
