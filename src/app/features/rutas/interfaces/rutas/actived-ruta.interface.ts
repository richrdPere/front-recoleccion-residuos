import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaDetalleData } from "./update-ruta.interface";

// *********************************************************
// ESTADO OPERATIVO DE RUTA
// *********************************************************
export type EstadoRuta =
  | 'BORRADOR'
  | 'ACTIVA'
  | 'INACTIVA';

// *********************************************************
// REQUEST
// *********************************************************
export interface ChangeRutaEstadoOperativoRequest {
  estado_ruta: EstadoRuta;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type ChangeRutaEstadoOperativoResponse = ApiResponse<RutaDetalleData>;

