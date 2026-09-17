import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// TIPO DE PUNTO
// *********************************************************
export type TipoRutaPunto =
  | 'INICIO'
  | 'RECOLECCION'
  | 'DESCARGA'
  | 'FINAL'
  | 'REFERENCIA';

// *********************************************************
// REQUEST PARA CREAR PUNTO
// *********************************************************
export interface CreateRutaPuntoRequest {
  codigo: string;
  nombre: string;
  descripcion: string;

  tipo_punto: TipoRutaPunto;

  latitud: number;
  longitud: number;

  orden: number;
  radio_atencion_metros: number;
  tiempo_estimado_min: number;

  obligatorio: boolean;
}

// *********************************************************
// PUNTO CREADO
// *********************************************************
export interface CreateRutaPuntoData {
  id_ruta_punto: number;
  id_ruta_version: number;

  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_punto: TipoRutaPunto;

  latitud: number;
  longitud: number;

  orden: number;
  radio_atencion_metros: number;
  tiempo_estimado_min: number;

  obligatorio: boolean;
  estado: boolean;

  created_at: string;
  updated_at: string;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type CreateRutaPuntoResponse = ApiResponse<CreateRutaPuntoData>;
