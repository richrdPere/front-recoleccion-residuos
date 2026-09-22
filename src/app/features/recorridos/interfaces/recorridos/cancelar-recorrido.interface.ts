import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// RECORRIDO
// Compartible con los endpoints de detalle y otras acciones.
// *********************************************************
export interface RecorridoData {
  id_recorrido: number;
  id_programacion: number;
  id_usuario_inicio: number;
  id_usuario_finalizacion: number | null;

  estado_recorrido:
  | 'EN_CURSO'
  | 'PAUSADO'
  | 'FINALIZADO'
  | 'CANCELADO';

  fecha_hora_inicio: string;
  fecha_hora_finalizacion: string | null;

  latitud_inicio: string | null;
  longitud_inicio: string | null;
  precision_inicio: string | null;

  latitud_finalizacion: string | null;
  longitud_finalizacion: string | null;
  precision_finalizacion: string | null;

  kilometraje_inicio: string | null;
  kilometraje_final: string | null;

  // El ejemplo solo muestra null; confirmar el tipo no nulo
  // con el modelo Sequelize.
  distancia_recorrida_metros: string | number | null;
  duracion_segundos: number | null;

  observacion_inicio: string | null;
  observacion_finalizacion: string | null;
  motivo_cancelacion: string | null;

  estado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  programacion: RecorridoProgramacion;
  usuario_inicio: RecorridoUsuario;
  usuario_finalizacion: RecorridoUsuario | null;
  eventos: RecorridoEvento[];
}

// *********************************************************
// PROGRAMACIÓN ASOCIADA
// *********************************************************
export interface RecorridoProgramacion {
  id_programacion: number;
  id_ruta: number;
  id_ruta_version: number;
  id_vehiculo: number;
  id_usuario_creacion: number;

  fecha_programada: string;
  hora_inicio_programada: string;
  hora_fin_programada: string;
  turno: string;
  estado_programacion: string;

  observacion: string | null;
  motivo_cancelacion: string | null;
  fecha_cancelacion: string | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// USUARIOS
// *********************************************************
export interface RecorridoUsuario {
  id_usuario: number;
  username: string;
  email_acceso: string;
}

export interface RecorridoEventoUsuario {
  id_usuario: number;
  username: string;
}

// *********************************************************
// EVENTOS
// *********************************************************
export interface RecorridoEvento {
  id_recorrido_evento: number;
  id_recorrido: number;
  id_usuario: number;

  tipo_evento:
  | 'INICIO'
  | 'PAUSA'
  | 'REANUDACION'
  | 'FINALIZACION'
  | 'CANCELACION';

  fecha_evento: string;
  fecha_recepcion: string;

  latitud: string | null;
  longitud: string | null;
  precision_gps: string | null;

  observacion: string | null;
  clave_idempotencia: string | null;

  // Su estructura todavía no se conoce.
  datos: unknown;

  origen: 'WEB' | 'APP' | 'SISTEMA';
  ip: string | null;
  user_agent: string | null;
  created_at: string;

  usuario: RecorridoEventoUsuario;
}


// *********************************************************
// REQUEST
// *********************************************************
export interface CancelarRecorridoRequest {
  motivo: string;
  latitud?: number | null;
  longitud?: number | null;
  observacion?: string | null;
  clave_idempotencia?: string | null;
  fecha_evento?: string | null;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type CancelarRecorridoResponse = ApiResponse<RecorridoData>;
