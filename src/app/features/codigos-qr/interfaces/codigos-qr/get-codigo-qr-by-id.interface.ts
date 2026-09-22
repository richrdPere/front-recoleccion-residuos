import {
  CodigoQrListadoItem,
} from './get-codigos-qr-paginado.interface';

// *********************************************************
// RESPONSE
// *********************************************************
export interface GetCodigoQrByIdResponse {
  success: boolean;
  message: string;
  data: CodigoQrDetalleData;
}

// *********************************************************
// DETALLE DEL CÓDIGO QR
// *********************************************************
export interface CodigoQrDetalleData extends CodigoQrListadoItem {
  // Pendiente de tipar sus campos cuando estas asociaciones
  // aparezcan con datos en la respuesta.
  codigo_reemplazado: Record<string, unknown> | null;
  codigo_reemplazo: Record<string, unknown> | null;
}
