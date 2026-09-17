import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// REQUEST PARA RETIRAR PERSONAL
// *********************************************************
export interface RemovePersonalProgramacionRequest {
  observacion: string;
}

// *********************************************************
// ASIGNACIÓN RETIRADA
// *********************************************************
export interface RemovePersonalProgramacionData {
  id_programacion_personal: number;
  id_programacion: number;
  id_personal: number;

  funcion: string;
  es_principal: boolean;
  estado_asignacion: string;

  fecha_respuesta: string | null;
  observacion: string | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type RemovePersonalProgramacionResponse = ApiResponse<RemovePersonalProgramacionData>;
