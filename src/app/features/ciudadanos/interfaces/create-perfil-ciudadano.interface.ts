// *********************************************************
// REQUEST
// *********************************************************
export interface CrearPerfilCiudadanoRequest {
  acepta_tratamiento_datos: boolean;
  version_consentimiento: string;
  origen_registro: string;
  observacion: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface CrearPerfilCiudadanoResponse {
  success: boolean;
  message: string;
  data: PerfilCiudadanoData;
}

// *********************************************************
// PERFIL CIUDADANO
// *********************************************************
export interface PerfilCiudadanoData {
  id_ciudadano: number;
  id_usuario: number;

  celular_verificado: boolean;

  acepta_tratamiento_datos: boolean;
  fecha_consentimiento: string | null;
  version_consentimiento: string;

  origen_registro: string;
  estado_ciudadano: string;
  fecha_activacion: string | null;

  observacion: string | null;

  created_at: string;
  updated_at: string;
}
