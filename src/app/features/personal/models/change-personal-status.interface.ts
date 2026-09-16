import { ApiResponse } from "src/app/core/models/api-response.model";
import { EstadoLaboralPersonal } from "./data/personal-operativo.types";
import { PersonalOperativoData } from "./data/personal-operativo-data.model";

export interface ChangePersonalEstadoRequest {
  estado: boolean;
}

export interface ChangePersonalEstadoOperativoRequest {
  estado_operativo: EstadoLaboralPersonal;

  observacion?: string | null;
}

// ==========================================================
// RESPONSE
// ==========================================================

export type ChangePersonalEstadoResponse = ApiResponse<PersonalOperativoData>;
