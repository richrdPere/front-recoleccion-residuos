import { ApiResponse } from "src/app/core/models/api-response.model";


// *********************************************************
// PERSONAL OPERATIVO DISPONIBLE
// *********************************************************
export interface ConductorDisponibleData {
  id_personal: number;
  id_usuario: number;
  codigo_empleado: string;

  fecha_ingreso: string;
  fecha_salida: string | null;

  tipo_contrato: string;
  turno_preferente: string;
  estado_laboral: string;
  observacion: string | null;
  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  usuario: ConductorDisponibleUsuario;
  conductor: ConductorDisponiblePerfil;
}

// *********************************************************
// USUARIO
// *********************************************************
export interface ConductorDisponibleUsuario {
  id_usuario: number;
  username: string;
  email_acceso: string;

  persona: ConductorDisponiblePersona;
  roles: ConductorDisponibleRol[];
}

// *********************************************************
// PERSONA
// *********************************************************
export interface ConductorDisponiblePersona {
  id_persona: number;
  nombres: string;
  apellidos: string;
  numero_documento: string;
  celular: string | null;
  foto_url: string | null;
}

// *********************************************************
// ROL
// *********************************************************
export interface ConductorDisponibleRol {
  id_rol: number;
  nombre: string;
}

// *********************************************************
// PERFIL DE CONDUCTOR
// *********************************************************
export interface ConductorDisponiblePerfil {
  id_conductor: number;
  id_personal: number;

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


// *********************************************************
// RESPUESTA
// *********************************************************
export type GetConductoresDisponiblesResponse = ApiResponse<ConductorDisponibleData[]>;
