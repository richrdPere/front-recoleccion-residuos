import { ApiResponse } from "src/app/core/models/api-response.model";
import { ZonaData } from "../../../zonas/interfaces";
import { RutaData } from "./create-ruta.interface";
import { RutaHorarioData, RutaVersionDetalleData } from "./get-ruta-by-zona-id.interface";
import { TipoRutaPunto } from "../ruta-puntos";

// *********************************************************
// REQUEST PARA ACTUALIZAR RUTA
// *********************************************************
export interface UpdateRutaRequest {
  nombre: string;
  descripcion: string;
  color: string;
}

// *********************************************************
// PUNTO DE RUTA
// *********************************************************
export interface RutaPuntoData {
  id_ruta_punto: number;
  id_ruta_version: number;

  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo_punto: TipoRutaPunto;

  latitud: string;
  longitud: string;

  orden: number;
  radio_atencion_metros: number;
  tiempo_estimado_min: number;

  obligatorio: boolean;
  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// VERSIÓN CON PUNTOS
// *********************************************************
export interface RutaVersionConPuntosData
  extends RutaVersionDetalleData {
  puntos: RutaPuntoData[];
}

// *********************************************************
// DETALLE COMPLETO DE RUTA
// *********************************************************
export interface RutaDetalleData extends RutaData {
  deleted_at: string | null;

  zona: ZonaData | null;
  version_vigente: RutaVersionConPuntosData | null;
  horarios: RutaHorarioData[];
}

// *********************************************************
// RESPUESTA DE ACTUALIZACIÓN
// *********************************************************
export type UpdateRutaResponse = ApiResponse<RutaDetalleData>;
