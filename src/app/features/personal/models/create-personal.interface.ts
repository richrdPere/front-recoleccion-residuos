import { ApiResponse } from "src/app/core/models/api-response.model";
import { PersonalOperativoData } from "./data/personal-operativo-data.model";
import { EstadoLaboralPersonal, TipoContratoPersonal, TurnoPreferentePersonal } from "./data/personal-operativo.types";

// ============================================================
// REQUEST
// ============================================================
export interface CreatePersonalOperativoRequest {
  id_usuario: number;

  codigo_empleado: string;
  fecha_ingreso: string;
  tipo_contrato: TipoContratoPersonal;
  turno_preferente?: TurnoPreferentePersonal | null;
  estado_laboral?: EstadoLaboralPersonal;

  observacion?: string | null;
}

// ============================================================
// RESPONSE
// ============================================================
export type CreatePersonalOperativoResponse = ApiResponse<PersonalOperativoData>;


