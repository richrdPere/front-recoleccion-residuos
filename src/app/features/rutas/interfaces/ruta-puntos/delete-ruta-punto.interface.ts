import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// RESULTADO DE ELIMINACIÓN
// *********************************************************
export interface DeleteRutaPuntoData {
  id_ruta_punto: number;
  deleted: boolean;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type DeleteRutaPuntoResponse = ApiResponse<DeleteRutaPuntoData>;
