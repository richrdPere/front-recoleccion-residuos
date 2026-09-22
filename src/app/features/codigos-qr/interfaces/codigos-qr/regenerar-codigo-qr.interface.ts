import { CodigoQrData } from "./create-codigo-qr.interface";
import { EstadoQr } from "./update-estado-codigo-qr.interface";

// *********************************************************
// REQUEST
// *********************************************************
export interface RegenerarCodigoQrRequest {
  motivo: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface RegenerarCodigoQrResponse {
  success: boolean;
  message: string;
  data: RegenerarCodigoQrData;
}

export interface RegenerarCodigoQrData {
  codigo_anterior: CodigoQrAnteriorData;
  codigo_nuevo: CodigoQrRegeneradoData;
  url_publica: string;
}

// *********************************************************
// CÓDIGO ANTERIOR
// *********************************************************
export interface CodigoQrAnteriorData {
  id_codigo_qr: number;
  codigo: string;
  estado_qr: EstadoQr;
}

// *********************************************************
// CÓDIGO NUEVO
// *********************************************************
export interface CodigoQrRegeneradoData extends CodigoQrData {
  id_codigo_reemplazado: number;
}
