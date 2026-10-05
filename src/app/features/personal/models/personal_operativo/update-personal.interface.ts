import { ApiResponse } from "src/app/core/models/api-response.model";
import { EstadoLaboralPersonal, TipoContratoPersonal, TurnoPreferentePersonal } from "./data/personal-operativo.types";
import { PersonalOperativoData } from "./data/personal-operativo-data.model";

// ============================================================
// REQUEST
// ============================================================
export interface UpdatePersonalOperativoRequest {
  codigo_empleado?: string;
  fecha_ingreso?: string;
  fecha_salida?: string | null;
  tipo_contrato?: TipoContratoPersonal;
  turno_preferente?: TurnoPreferentePersonal | null;
  estado_laboral?: EstadoLaboralPersonal;
  observacion?: string | null;
}

// ============================================================
// RESPONSE
// ============================================================
export type UpdatePersonalOperativoResponse = ApiResponse<PersonalOperativoData>;
