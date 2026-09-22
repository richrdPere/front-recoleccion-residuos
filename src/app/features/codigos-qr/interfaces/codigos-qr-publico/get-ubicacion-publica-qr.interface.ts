import {
  QrPublicoUbicacion,
} from './get-informacion-publica-qr.interface';

// *********************************************************
// RESPONSE
// *********************************************************
export interface GetUbicacionPublicaQrResponse {
  success: boolean;
  message: string;
  data: QrPublicoUbicacion;
}
