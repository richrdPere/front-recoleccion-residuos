import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// RESULTADO DE ELIMINACIÓN
// *********************************************************
export interface DeleteRutaHorarioData {
  id_ruta_horario: number;
  deleted: boolean;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type DeleteRutaHorarioResponse = ApiResponse<DeleteRutaHorarioData>;
