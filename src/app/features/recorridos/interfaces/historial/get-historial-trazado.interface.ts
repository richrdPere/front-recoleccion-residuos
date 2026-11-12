import type { FeatureCollection, LineString, Point } from 'geojson';
import { ApiResponse } from 'src/app/core/models/api-response.model';

// *********************************************************
// PROPIEDADES DE LOS ELEMENTOS DEL MAPA
// *********************************************************
export interface HistorialTrazadoProperties {
  tipo:
  | 'GPS'
  | 'GPS_AISLADO'
  | 'PRIMER_GPS'
  | 'ULTIMO_GPS';
}

// *********************************************************
// DATA
// *********************************************************
export interface HistorialTrazado {
  geojson: FeatureCollection<
    LineString | Point,
    HistorialTrazadoProperties
  >;

  total_en_servidor: number;

  muestras_cargadas: number;
  muestras_validas: number;
  muestras_descartadas: number;

  /** Separación máxima entre muestras de un mismo segmento. */
  corte_por_hueco_segundos: number;

  /** Indica si se comprobó la sincronización de los dispositivos. */
  sincronizacion_dispositivos_verificada: boolean;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetHistorialTrazadoResponse = ApiResponse<HistorialTrazado>;
