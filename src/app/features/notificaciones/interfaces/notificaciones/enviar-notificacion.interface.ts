import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// REQUEST
// *********************************************************
export interface EnviarNotificacionRequest {
  tipo_notificacion: string;
  titulo: string;
  mensaje: string;
  destinatarios: number[];
  prioridad: string;
  enviar_interna: boolean;
  enviar_push: boolean;
  clave_evento: string;
}

// *********************************************************
// NOTIFICACIÓN
// *********************************************************
export interface NotificacionData {
  id_notificacion: number;
  id_usuario_creacion: number | null;

  tipo_notificacion: string;
  prioridad: string;
  titulo: string;
  mensaje: string;

  enviar_interna: boolean;
  enviar_push: boolean;

  tipo_entidad: string | null;
  id_entidad: number | null;
  datos: unknown;

  clave_evento: string | null;
  fecha_programada: string | null;
  fecha_expiracion: string | null;

  estado_notificacion: string;
  origen: string;
  fecha_procesamiento: string | null;

  created_at: string;
  updated_at: string;

  creador: NotificacionUsuario | null;
  destinatarios: NotificacionDestinatarioData[];
}

// *********************************************************
// ESTADO POR DESTINATARIO
// *********************************************************
export interface NotificacionDestinatarioData {
  id_notificacion_usuario: number;
  id_notificacion: number;
  id_usuario: number;

  leida: boolean;
  fecha_leida: string | null;

  archivada: boolean;
  fecha_archivada: string | null;

  estado_push: string;
  fecha_ultimo_envio: string | null;
  cantidad_intentos: number;
  ultimo_error: string | null;

  created_at: string;
  updated_at: string;

  destinatario: NotificacionUsuario;
}

// *********************************************************
// USUARIO
// *********************************************************
export interface NotificacionUsuario {
  id_usuario: number;
  username: string;
  email_acceso: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type EnviarNotificacionResponse = ApiResponse<EnviarNotificacionData>;


export interface EnviarNotificacionData {
  notificacion: NotificacionData;
  creada: boolean;
  duplicada: boolean;
}
