import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaData } from "./create-ruta.interface";

// *********************************************************
// REQUEST PARA CAMBIAR ESTADO DEL REGISTRO
// *********************************************************
export interface ChangeRutaEstadoRequest {
  estado: boolean;
}

// *********************************************************
// DATOS DEL REGISTRO ACTUALIZADO
// *********************************************************
export interface ChangeRutaEstadoData extends RutaData {
  deleted_at: string | null;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type ChangeRutaEstadoResponse = ApiResponse<ChangeRutaEstadoData>;
