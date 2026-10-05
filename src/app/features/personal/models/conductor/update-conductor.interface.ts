// Ajusta la ruta al archivo de interfaces del perfil.
import {
  PerfilConductorData,
} from './get-perfil-conductor.interface';

// *********************************************************
// SOLICITUD
// *********************************************************

export interface UpdateConductorRequest {
  categoria_licencia: string;
  fecha_emision_licencia: string;
  fecha_vencimiento_licencia: string;
  estado_licencia: string;
  restricciones?: string | null;
  observacion?: string | null;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export interface UpdateConductorResponse {
  success: boolean;
  message: string;
  data: PerfilConductorData;
}
