// *********************************************************
// TIPOS
// *********************************************************

// BIGINT puede llegar como número o cadena desde el backend.
export type ConductorDisponibleIdentificador = number | string;

export type ConductorDisponibleRolNombre =
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

export interface GetConductoresDisponiblesResponse {
  success: boolean;
  message: string;
  data: ConductorDisponibleItem[];
}

// *********************************************************
// PERSONAL OPERATIVO
// *********************************************************

export interface ConductorDisponibleItem {
  id_personal: ConductorDisponibleIdentificador;
  id_usuario: ConductorDisponibleIdentificador;
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

  usuario: ConductorDisponibleUsuario;
  conductor: ConductorDisponibleLicencia;
}

// *********************************************************
// USUARIO
// *********************************************************

export interface ConductorDisponibleUsuario {
  id_usuario: ConductorDisponibleIdentificador;
  username: string;
  email_acceso: string;
  estado: boolean;

  persona: ConductorDisponiblePersona;
  roles: ConductorDisponibleRol[];
}

// *********************************************************
// PERSONA
// *********************************************************

export interface ConductorDisponiblePersona {
  id_persona: ConductorDisponibleIdentificador;
  nombres: string;
  apellidos: string;
  numero_documento: string;
  celular: string | null;
  foto_url: string | null;
  estado: boolean;
}

// *********************************************************
// ROL
// *********************************************************

export interface ConductorDisponibleRol {
  id_rol: ConductorDisponibleIdentificador;
  nombre: ConductorDisponibleRolNombre;
}

// *********************************************************
// LICENCIA DEL CONDUCTOR
// *********************************************************

export interface ConductorDisponibleLicencia {
  id_conductor: ConductorDisponibleIdentificador;
  id_personal: ConductorDisponibleIdentificador;

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
}
