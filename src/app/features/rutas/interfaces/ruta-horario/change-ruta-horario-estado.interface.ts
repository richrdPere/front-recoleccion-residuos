// Ajusta la ruta según tu estructura.

import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaHorarioData } from "../rutas";


// *********************************************************
// REQUEST PARA CAMBIAR ESTADO
// *********************************************************
export interface ChangeRutaHorarioEstadoRequest {
  estado: boolean;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type ChangeRutaHorarioEstadoResponse = ApiResponse<RutaHorarioData>;
