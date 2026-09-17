// *********************************************************
// ESTADO DE PROGRAMACIÓN

import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
export type EstadoProgramacion =
  | 'PROGRAMADA'
  | 'ASIGNADA'
  | 'ACEPTADA'
  | 'EN_CURSO'
  | 'PAUSADA'
  | 'FINALIZADA'
  | 'CANCELADA';



// *********************************************************
// DATOS PAGINADOS
// *********************************************************
export interface ProgramacionesPaginadasData {
  items: ProgramacionPaginadaItem[];

  total: number;
  page: number;
  limit: number;
  total_pages: number;

  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// PROGRAMACIÓN DEL LISTADO
// *********************************************************
export interface ProgramacionPaginadaItem {
  id_programacion: number;
  id_ruta: number;
  id_ruta_version: number;
  id_vehiculo: number;
  id_usuario_creacion: number;

  fecha_programada: string;
  hora_inicio_programada: string;
  hora_fin_programada: string;

  turno: string;
  estado_programacion: EstadoProgramacion;
  observacion: string | null;

  motivo_cancelacion: string | null;
  fecha_cancelacion: string | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  ruta: ProgramacionPaginadaRuta;
  version_ruta: ProgramacionPaginadaVersionRuta;
  vehiculo: ProgramacionPaginadaVehiculo;
  personal_asignado: ProgramacionPaginadaPersonalAsignado[];
}

// *********************************************************
// RUTA RESUMIDA
// *********************************************************
export interface ProgramacionPaginadaRuta {
  id_ruta: number;
  codigo: string;
  nombre: string;
}

// *********************************************************
// VERSIÓN DE RUTA RESUMIDA
// *********************************************************
export interface ProgramacionPaginadaVersionRuta {
  id_ruta_version: number;
  numero_version: number;
}

// *********************************************************
// VEHÍCULO RESUMIDO
// *********************************************************
export interface ProgramacionPaginadaVehiculo {
  id_vehiculo: number;
  codigo: string;
  placa: string;
  marca: string;
  modelo: string;
}

// *********************************************************
// ASIGNACIÓN DE PERSONAL
// *********************************************************
export interface ProgramacionPaginadaPersonalAsignado {
  id_programacion_personal: number;

  funcion: string;
  es_principal: boolean;
  estado_asignacion: string;

  personal: ProgramacionPaginadaPersonal;
}

// *********************************************************
// PERSONAL OPERATIVO RESUMIDO
// *********************************************************
export interface ProgramacionPaginadaPersonal {
  id_personal: number;
  codigo_empleado: string;

  usuario: ProgramacionPaginadaUsuario;
}

// *********************************************************
// USUARIO RESUMIDO
// *********************************************************
export interface ProgramacionPaginadaUsuario {
  id_usuario: number;
  username: string;

  persona: ProgramacionPaginadaPersona;
}

// *********************************************************
// PERSONA RESUMIDA
// *********************************************************
export interface ProgramacionPaginadaPersona {
  nombres: string;
  apellidos: string;
}

// *********************************************************
// FILTROS DEL PAGINADO
// *********************************************************
export interface ProgramacionesPaginadasFilters {
  page?: number;
  limit?: number;
  search?: string;

  // Formato: YYYY-MM-DD.
  fecha_desde?: string;
  fecha_hasta?: string;

  estado_programacion?: EstadoProgramacion;

  id_ruta?: number;
  id_vehiculo?: number;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export type GetProgramacionesPaginatedResponse = ApiResponse<ProgramacionesPaginadasData>;
