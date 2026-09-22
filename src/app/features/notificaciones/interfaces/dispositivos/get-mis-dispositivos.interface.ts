import {
  DispositivoNotificacionData,
} from './registrar-dispositivo.interface';

// *********************************************************
// RESPONSE
// *********************************************************
export interface GetMisDispositivosResponse {
  success: boolean;
  message: string;
  data: MiDispositivoData[];
}

// *********************************************************
// DISPOSITIVO DEL LISTADO
// *********************************************************
export type MiDispositivoData = Omit<
  DispositivoNotificacionData,
  'token_registrado'
>;
