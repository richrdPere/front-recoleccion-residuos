import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// RECOLECTOR DISPONIBLE
// *********************************************************
export interface RecolectorDisponibleData {
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

  usuario: RecolectorDisponibleUsuario;
}

// *********************************************************
// USUARIO
// *********************************************************
export interface RecolectorDisponibleUsuario {
  id_usuario: number;
  username: string;
  email_acceso: string;

  persona: RecolectorDisponiblePersona;
  roles: RecolectorDisponibleRol[];
}

// *********************************************************
// PERSONA
// *********************************************************
export interface RecolectorDisponiblePersona {
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
export interface RecolectorDisponibleRol {
  id_rol: number;
  nombre: string;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type GetRecolectoresDisponiblesResponse = ApiResponse<RecolectorDisponibleData[]>;
