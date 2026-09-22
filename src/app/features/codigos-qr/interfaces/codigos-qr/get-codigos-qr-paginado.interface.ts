import { CodigoQrData, TipoRecursoQr } from "./create-codigo-qr.interface";
import { EstadoQr } from "./update-estado-codigo-qr.interface";

// *********************************************************
// QUERY PARAMS
// *********************************************************
export interface GetCodigosQrPaginadoParams {
  page?: number;
  limit?: number;
  search?: string | null;
  tipo_recurso?: TipoRecursoQr | null;
  id_zona?: number | null;
  id_ruta?: number | null;
  estado_qr?: EstadoQr  | null;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface GetCodigosQrPaginadoResponse {
  success: boolean;
  message: string;
  data: CodigosQrPaginadoData;
}

export interface CodigosQrPaginadoData {
  items: CodigoQrListadoItem[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// *********************************************************
// CÓDIGO QR DEL LISTADO
// *********************************************************
export interface CodigoQrListadoItem extends CodigoQrData {
  id_codigo_reemplazado: number | null;
  fecha_revocacion: string | null;
  motivo_revocacion: string | null;
  deleted_at: string | null;

  // Pendiente de tipar cuando compartas una zona no nula.
  zona: Record<string, unknown> | null;

  ruta: CodigoQrListadoRuta | null;
  usuario_creacion: CodigoQrListadoUsuario | null;

  url_publica: string;
}

// *********************************************************
// RUTA
// *********************************************************
export interface CodigoQrListadoRuta {
  id_ruta: number;
  id_zona: number;

  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;

  estado_ruta: 'BORRADOR' | 'ACTIVA' | 'INACTIVA';
  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// USUARIO CREADOR
// *********************************************************
export interface CodigoQrListadoUsuario {
  id_usuario: number;
  username: string;
}
