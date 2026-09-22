import { NotificacionByIdData } from './get-notificacion-by-id.interface';

// *********************************************************
// RESPONSE
// *********************************************************
export interface ArchivarNotificacionResponse {
  success: boolean;
  message: string;
  data: NotificacionByIdData;
}
