import { ApiResponse } from "src/app/core/models/api-response.model";
import { ZonaData } from "./get-zonas-paginated.interface";

// *********************************************************
// REQUEST PARA CAMBIAR ESTADO
// *********************************************************
export interface ChangeZonaEstadoRequest {
  estado: boolean;
}

// *********************************************************
// RESPUESTA DE CAMBIO DE ESTADO
// *********************************************************
export type ChangeZonaEstadoResponse = ApiResponse<ZonaData>;
