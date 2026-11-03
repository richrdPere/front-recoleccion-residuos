export type NotificacionSocketId = number | string;

export type EstadoNotificacionesSocket =
  | 'DESCONECTADO'
  | 'CONECTANDO'
  | 'CONECTADO'
  | 'RECONECTANDO'
  | 'RENOVANDO_TOKEN'
  | 'AUTENTICACION_REQUERIDA';

export interface ErrorNotificacionesSocket {
  code: string;
  message: string;
  statusCode: number;
}

export interface NotificacionNuevaSocket {
  id_notificacion: NotificacionSocketId;
  id_notificacion_usuario: NotificacionSocketId;

  tipo_notificacion: string;
  prioridad: string;
  titulo: string;
  mensaje: string;

  tipo_entidad: string | null;
  id_entidad: NotificacionSocketId | null;
  datos: unknown;

  created_at: string;
  refrescar: boolean;
}

export interface NotificacionLeidaSocket {
  id_notificacion_usuario: NotificacionSocketId;
  fecha_leida: string | null;
}

export interface NotificacionesTodasLeidasSocket {
  actualizadas: number;
}

export interface NotificacionArchivadaSocket {
  id_notificacion_usuario: NotificacionSocketId;
  fecha_archivada: string | null;
}

export interface PayloadsNotificacionesSocket {
  'notificacion:nueva': NotificacionNuevaSocket;
  'notificacion:leida': NotificacionLeidaSocket;
  'notificacion:todas-leidas': NotificacionesTodasLeidasSocket;
  'notificacion:archivada': NotificacionArchivadaSocket;
}

/**
 * Conserva la relación entre el nombre del evento y su payload.
 * id_usuario corresponde a la sesión que abrió la conexión.
 */
export type EventoNotificacionesSocket = {
  [K in keyof PayloadsNotificacionesSocket]: {
    evento: K;
    id_usuario: string;
    datos: PayloadsNotificacionesSocket[K];
  };
}[keyof PayloadsNotificacionesSocket];
