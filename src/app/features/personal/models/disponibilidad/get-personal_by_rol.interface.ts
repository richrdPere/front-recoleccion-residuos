// *********************************************************
// TIPOS
// *********************************************************

export type PersonalPorRolIdentificador = number | string;

export type PersonalPorRolNombre =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'OPERADOR'
  | 'CONDUCTOR'
  | 'RECOLECTOR'
  | 'CIUDADANO';

// *********************************************************
// RESPUESTA
// *********************************************************

export interface GetPersonalByRolResponse {
  success: boolean;
  message: string;
  data: PersonalPorRolItem[];
}

// *********************************************************
// PERSONAL OPERATIVO
// *********************************************************

export interface PersonalPorRolItem {
  id_personal: PersonalPorRolIdentificador;
  id_usuario: PersonalPorRolIdentificador;
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

  usuario: PersonalPorRolUsuario;
}

// *********************************************************
// USUARIO
// *********************************************************

export interface PersonalPorRolUsuario {
  id_usuario: PersonalPorRolIdentificador;
  username: string;
  email_acceso: string;
  estado: boolean;

  persona: PersonalPorRolPersona;
  roles: PersonalPorRolAsignado[];
}

// *********************************************************
// PERSONA
// *********************************************************

export interface PersonalPorRolPersona {
  id_persona: PersonalPorRolIdentificador;
  nombres: string;
  apellidos: string;
  numero_documento: string;
  celular: string | null;
  foto_url: string | null;
  estado: boolean;
}

// *********************************************************
// ROL ASIGNADO
// *********************************************************

export interface PersonalPorRolAsignado {
  id_rol: PersonalPorRolIdentificador;
  nombre: PersonalPorRolNombre;
}
