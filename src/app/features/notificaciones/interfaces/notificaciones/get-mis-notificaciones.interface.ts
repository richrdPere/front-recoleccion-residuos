import { ApiResponse } from 'src/app/core/models/api-response.model';
import { NotificacionData, NotificacionDestinatarioData } from './enviar-notificacion.interface';

// *********************************************************
// QUERY PARAMS
// *********************************************************
export interface GetMisNotificacionesParams {
  page?: number;
  limit?: number;
  leida?: boolean | null;
  archivada?: boolean;
  tipo_notificacion?: string | null;
  prioridad?: string | null;
  search?: string | null;
}



// *********************************************************
// DATA PAGINADA
// *********************************************************
export interface MisNotificacionesData {
  items: MiNotificacionItem[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// REGISTRO DEL DESTINATARIO
// Esta consulta no incluye la asociación "destinatario".
// *********************************************************
export interface MiNotificacionItem
  extends Omit<NotificacionDestinatarioData, 'destinatario'> {
  notificacion: MiNotificacionDetalle;
}

// *********************************************************
// NOTIFICACIÓN
// Esta consulta no incluye la lista "destinatarios".
// El creador solo contiene id_usuario y username.
// *********************************************************
export interface MiNotificacionDetalle
  extends Omit<NotificacionData, 'creador' | 'destinatarios'> {
  creador: MiNotificacionCreador | null;
}

export interface MiNotificacionCreador {
  id_usuario: number;
  username: string;
}


// *********************************************************
// RESPONSE
// *********************************************************
// export interface GetMisNotificacionesResponse {
//   success: boolean;
//   message: string;
//   data: MisNotificacionesData;
// }

export type GetMisNotificacionesResponse = ApiResponse<MisNotificacionesData>;
