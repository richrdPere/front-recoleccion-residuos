import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// RESULTADO DE ELIMINACIÓN
// *********************************************************
export interface DeleteRutaVersionData {
  id_ruta_version: number;
  deleted: boolean;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type DeleteRutaVersionResponse = ApiResponse<DeleteRutaVersionData>;
