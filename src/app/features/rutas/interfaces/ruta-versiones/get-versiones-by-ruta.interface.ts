import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaVersionConPuntosData } from "../rutas";

// *********************************************************
// RESPUESTA DE VERSIONES POR RUTA
// *********************************************************
export type GetVersionesByRutaResponse = ApiResponse<RutaVersionConPuntosData[]>;
