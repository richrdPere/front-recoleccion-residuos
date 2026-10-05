// *********************************************************
// TIPOS
// *********************************************************

export type PerfilConductorIdentificador = number | string;

// *********************************************************
// RESPUESTA
// *********************************************************

export interface GetPerfilConductorResponse {
  success: boolean;
  message: string;
  data: PerfilConductorData;
}

// *********************************************************
// PERFIL DEL CONDUCTOR
// *********************************************************

export interface PerfilConductorData {
  id_conductor: PerfilConductorIdentificador;
  id_personal: PerfilConductorIdentificador;

  numero_licencia: string;
  categoria_licencia: string;
  fecha_emision_licencia: string;
  fecha_vencimiento_licencia: string;
  estado_licencia: string;

  restricciones: string | null;
  observacion: string | null;
  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  personal: PerfilConductorPersonal;
}

// *********************************************************
// PERSONAL OPERATIVO
// *********************************************************

export interface PerfilConductorPersonal {
  id_personal: PerfilConductorIdentificador;
  id_usuario: PerfilConductorIdentificador;
  codigo_empleado: string;

  fecha_ingreso: string;
  fecha_salida: string | null;

  tipo_contrato: string;
  turno_preferente: string | null;
  estado_laboral: string;
  observacion: string | null;
  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  usuario: PerfilConductorUsuario;
}

// *********************************************************
// USUARIO
// *********************************************************

export interface PerfilConductorUsuario {
  id_usuario: PerfilConductorIdentificador;
  username: string;
  email_acceso: string;
  estado: boolean;

  persona: PerfilConductorPersona;
}

// *********************************************************
// PERSONA
// *********************************************************

export interface PerfilConductorPersona {
  id_persona: PerfilConductorIdentificador;
  nombres: string;
  apellidos: string;
  numero_documento: string;
  celular: string | null;
  foto_url: string | null;
}
