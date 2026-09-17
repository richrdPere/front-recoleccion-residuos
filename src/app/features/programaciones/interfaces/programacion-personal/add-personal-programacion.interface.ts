// *********************************************************
// REQUEST PARA AGREGAR PERSONAL

import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
export interface AddPersonalProgramacionRequest {
  id_personal: number;
  funcion: string;
  es_principal: boolean;
  observacion: string | null;
}

// *********************************************************
// ASIGNACIÓN CREADA
// *********************************************************
export interface AddPersonalProgramacionData {
  id_programacion_personal: number;
  id_programacion: number;
  id_personal: number;

  funcion: string;
  es_principal: boolean;
  estado_asignacion: string;
  observacion: string | null;

  created_at: string;
  updated_at: string;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type AddPersonalProgramacionResponse = ApiResponse<AddPersonalProgramacionData>;
