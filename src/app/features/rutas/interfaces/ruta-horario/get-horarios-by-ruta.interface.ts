// Ajusta la ruta según tu estructura.
import { ApiResponse } from "src/app/core/models/api-response.model";
import { RutaHorarioData } from "../rutas";


// *********************************************************
// RESPUESTA DE HORARIOS POR RUTA
// *********************************************************
export type GetHorariosByRutaResponse = ApiResponse<RutaHorarioData[]>;
