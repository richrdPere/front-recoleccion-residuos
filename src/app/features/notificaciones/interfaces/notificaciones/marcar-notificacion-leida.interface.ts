import {
  NotificacionByIdData,
} from './get-notificacion-by-id.interface';

// *********************************************************
// RESPONSE
// *********************************************************
export interface MarcarNotificacionLeidaResponse {
  success: boolean;
  message: string;
  data: NotificacionByIdData;
}
