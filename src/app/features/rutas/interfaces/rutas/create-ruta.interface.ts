// *********************************************************
// REQUEST PARA CREAR RUTA

import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
export interface CreateRutaRequest {
  id_zona: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  color: string;
}

// *********************************************************
// DATOS DE RUTA
// *********************************************************
export interface RutaData {
  id_ruta: number;
  id_zona: number;

  codigo: string;
  nombre: string;
  descripcion: string;
  color: string;

  estado_ruta: string;
  estado: boolean;

  created_at: string;
  updated_at: string;
}

// *********************************************************
// RESPUESTA DE CREACIÓN
// *********************************************************
export type CreateRutaResponse = ApiResponse<RutaData>;
