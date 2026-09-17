import { ApiResponse } from "src/app/core/models/api-response.model";
import { ZonaData } from "../../../zonas/interfaces";
import { RutaData } from "./create-ruta.interface";
import { RutaVersionDetalleData } from "./get-ruta-by-zona-id.interface";

// *********************************************************
// RUTA ACTIVA
// *********************************************************
export interface RutaActivaData extends RutaData {
  deleted_at: string | null;

  zona: ZonaData | null;
  version_vigente: RutaVersionDetalleData | null;
}

// *********************************************************
// RESPUESTA DE RUTAS ACTIVAS
// *********************************************************

export type GetRutasActivasResponse = ApiResponse<RutaActivaData[]>;

