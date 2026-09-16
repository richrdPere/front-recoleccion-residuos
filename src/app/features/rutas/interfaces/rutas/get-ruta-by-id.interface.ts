import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaDetalleData } from "./update-ruta.interface";

// *********************************************************
// RESPUESTA DE RUTA POR ID
// *********************************************************
export type GetRutaByIdResponse = ApiResponse<RutaDetalleData>;
