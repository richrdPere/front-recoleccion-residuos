import { CodigoQrData } from "./create-codigo-qr.interface";

export type EstadoQr =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'REVOCADO';

// *********************************************************
// REQUEST
// *********************************************************
export interface ActualizarEstadoCodigoQrRequest {
  estado_qr: EstadoQr;
  motivo?: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface ActualizarEstadoCodigoQrResponse {
  success: boolean;
  message: string;
  data: CodigoQrEstadoActualizadoData;
}

// *********************************************************
// CÓDIGO QR ACTUALIZADO
// *********************************************************
export interface CodigoQrEstadoActualizadoData extends CodigoQrData {
  id_codigo_reemplazado: number | null;
  fecha_revocacion: string | null;
  motivo_revocacion: string | null;
  deleted_at: string | null;
}
