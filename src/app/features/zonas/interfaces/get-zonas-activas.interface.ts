
import { ApiResponse } from "src/app/core/models/api-response.model";
import { ZonaData } from "./get-zonas-paginated.interface";


// *********************************************************
// RESPUESTA DE ZONAS ACTIVAS
// *********************************************************
export type GetZonasActivasResponse = ApiResponse<ZonaData>;
