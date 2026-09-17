import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaVersionConPuntosData } from "../rutas";

// *********************************************************
// RESPUESTA DE ACTIVACIÓN DE VERSIÓN
// *********************************************************
export type ActivateRutaVersionResponse = ApiResponse<RutaVersionConPuntosData[]>;
