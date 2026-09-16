import { ApiResponse } from "src/app/core/models/api-response.model";
import { PersonalOperativoData } from "./data/personal-operativo-data.model";
import { EstadoLaboralPersonal, NombreRol, TipoContratoPersonal } from "./data/personal-operativo.types";

// ============================================================
// FILTROS
// ============================================================
export interface PersonalPaginadoFilters {
  page?: number;
  limit?: number;

  search?: string;
  estado?: boolean;
  estado_laboral?: EstadoLaboralPersonal;

  tipo_contrato?: TipoContratoPersonal;
  rol?: NombreRol;
}

// ============================================================
// DATA PAGINADA
// ============================================================
export interface PersonalPaginationData {
  total: number;
  page: number;
  limit: number;

  total_pages: number;

  has_next_page: boolean;
  has_previous_page: boolean;
}

export interface PersonalPaginadoData {
  items: PersonalOperativoData[];
  pagination: PersonalPaginationData;
}

// ============================================================
// RESPONSE
// ============================================================
export type GetPersonalPaginatedResponse = ApiResponse<PersonalPaginadoData>;

// export interface GetPersonalPaginatedResponse {
//   success: boolean;
//   message: string;
//   data: PersonalPaginadoData;
// }
