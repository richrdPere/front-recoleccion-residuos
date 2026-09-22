import { EstadoQr } from "./update-estado-codigo-qr.interface";

// *********************************************************
// TIPO DE RECURSO
// *********************************************************
export type TipoRecursoQr = 'RUTA' | 'ZONA';

// *********************************************************
// CAMPOS COMUNES DEL REQUEST
// *********************************************************
export interface CrearCodigoQrBaseRequest {
  titulo: string;
  descripcion: string;
  fecha_expiracion: string | null;
  observacion: string;
}

// *********************************************************
// REQUEST POR RECURSO
// *********************************************************
export type CrearCodigoQrRequest = CrearCodigoQrBaseRequest & (
  | {
    tipo_recurso: 'RUTA';
    id_ruta: number;
    id_zona?: never;
  }
  | {
    tipo_recurso: 'ZONA';
    id_zona: number;
    id_ruta?: never;
  }
);

// *********************************************************
// RESPONSE
// *********************************************************
export interface CrearCodigoQrResponse {
  success: boolean;
  message: string;
  data: CrearCodigoQrData;
}

export interface CrearCodigoQrData {
  codigo_qr: CodigoQrData;
  url_publica: string;
}

// *********************************************************
// CÓDIGO QR
// *********************************************************
export interface CodigoQrData {
  id_codigo_qr: number;
  codigo: string;
  token_publico: string;

  tipo_recurso: TipoRecursoQr;
  id_zona: number | null;
  id_ruta: number | null;

  titulo: string;
  descripcion: string | null;

  version: number;
  estado_qr: EstadoQr;

  fecha_generacion: string;
  fecha_expiracion: string | null;

  id_usuario_creacion: number;
  observacion: string | null;

  created_at: string;
  updated_at: string;
}
