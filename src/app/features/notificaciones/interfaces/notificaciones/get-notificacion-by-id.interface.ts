import { ApiResponse } from 'src/app/core/models/api-response.model';
import {
  NotificacionData,
  NotificacionDestinatarioData,
} from './enviar-notificacion.interface';

// *********************************************************
// REGISTRO DEL DESTINATARIO
// *********************************************************
export interface NotificacionByIdData
  extends Omit<NotificacionDestinatarioData, 'destinatario'> {
  notificacion: NotificacionByIdDetalle;
}

// *********************************************************
// NOTIFICACIÓN SIN ASOCIACIONES
// *********************************************************
export type NotificacionByIdDetalle = Omit<
  NotificacionData,
  'creador' | 'destinatarios'
>;

// *********************************************************
// RESPONSE
// *********************************************************
// export interface GetNotificacionByIdResponse {
//   success: boolean;
//   message: string;
//   data: NotificacionByIdData;
// }

export type GetNotificacionByIdResponse = ApiResponse<NotificacionByIdData>;
