import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaVersionConPuntosData } from "../rutas";

// *********************************************************
// RESPUESTA DE VERSIÓN VIGENTE
// *********************************************************
export type GetVersionVigenteByRutaResponse = ApiResponse<RutaVersionConPuntosData>;
