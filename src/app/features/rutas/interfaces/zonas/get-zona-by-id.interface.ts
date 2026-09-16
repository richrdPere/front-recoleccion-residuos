import { ApiResponse } from "src/app/core/models/api-response.model";
import { ZonaData } from "./get-zonas-paginated.interface";

// *********************************************************
// RUTA ASOCIADA A UNA ZONA
// *********************************************************
export interface ZonaRutaData {
  id_ruta: number;
  codigo: string;
  nombre: string;
  color: string | null;
  estado_ruta: string;
  estado: boolean;
}

// *********************************************************
// DETALLE DE ZONA
// *********************************************************
export interface ZonaDetalleData extends ZonaData {
  rutas: ZonaRutaData[];
}

// *********************************************************
// RESPUESTA DE ZONA POR ID
// *********************************************************
export type GetZonaByIdResponse = ApiResponse<ZonaDetalleData>;
