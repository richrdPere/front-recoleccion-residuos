import {
  QrPublicoEstadoRuta,
} from './get-informacion-publica-qr.interface';

// *********************************************************
// QUERY PARAMS
// *********************************************************
export interface GetEstadoPublicoRutaParams {
  // Formato YYYY-MM-DD.
  fecha_referencia?: string | null;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface GetEstadoPublicoRutaResponse {
  success: boolean;
  message: string;
  data: QrPublicoEstadoRuta;
}
