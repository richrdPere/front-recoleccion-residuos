import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaHorarioData } from "../rutas";


// *********************************************************
// REQUEST PARA ACTUALIZAR HORARIO
// *********************************************************
export interface UpdateRutaHorarioRequest {
  // Formato: HH:mm:ss.
  hora_inicio: string;
  hora_fin: string;

  observacion: string;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type UpdateRutaHorarioResponse = ApiResponse<RutaHorarioData>;
