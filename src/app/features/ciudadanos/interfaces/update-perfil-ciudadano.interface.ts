import { PerfilCiudadanoData } from "./create-perfil-ciudadano.interface";


// *********************************************************
// REQUEST
// *********************************************************
export interface ActualizarPerfilCiudadanoRequest {
  acepta_tratamiento_datos: boolean;
  version_consentimiento: string;
  observacion: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface UpdatePerfilCiudadanoResponse {
  success: boolean;
  message: string;
  data: PerfilCiudadanoActualizadoData;
}

// *********************************************************
// PERFIL ACTUALIZADO
// *********************************************************
export interface PerfilCiudadanoActualizadoData
  extends PerfilCiudadanoData {
  fecha_verificacion_celular: string | null;
  fecha_desactivacion: string | null;
  motivo_desactivacion: string | null;
  deleted_at: string | null;
}
