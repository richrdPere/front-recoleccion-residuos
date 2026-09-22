import {
  QrPublicoZonaResumen,
  QrPublicoRutaCronograma,
} from './get-informacion-publica-qr.interface';

// *********************************************************
// QUERY PARAMS
// *********************************************************
export interface GetCronogramaPublicoQrParams {
  // Formato YYYY-MM-DD.
  fecha_referencia?: string | null;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface GetCronogramaPublicoQrResponse {
  success: boolean;
  message: string;
  data: CronogramaPublicoQrData;
}

// *********************************************************
// CRONOGRAMA SEGÚN EL TIPO DE RECURSO
// *********************************************************
export type CronogramaPublicoQrData =
  | CronogramaPublicoQrZona
  | CronogramaPublicoQrRuta;

export interface CronogramaPublicoQrZona {
  fecha_consulta: string;
  tipo_recurso: 'ZONA';
  zona: QrPublicoZonaResumen;
  rutas: QrPublicoRutaCronograma[];
}

export interface CronogramaPublicoQrRuta {
  fecha_consulta: string;
  tipo_recurso: 'RUTA';
  rutas: QrPublicoRutaCronograma[];
}
