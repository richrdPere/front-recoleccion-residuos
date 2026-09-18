import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// PUNTO RECORRIDO DATA
// *********************************************************
export interface PuntoRecorridoData {
  id_ruta_punto: number;
  id_ruta_version: number;

  codigo: string | null;
  nombre: string;
  descripcion: string | null;

  tipo_punto:
  | 'INICIO'
  | 'RECOLECCION'
  | 'DESCARGA'
  | 'FINAL'
  | 'REFERENCIA';

  latitud: string;
  longitud: string;
  orden: number;
  radio_atencion_metros: number | null;
  tiempo_estimado_min: number | null;

  obligatorio: boolean;
  estado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  estado_atencion: 'ATENDIDO' | 'PENDIENTE';
  recoleccion: PuntoRecorridoRecoleccion | null;
}

// *********************************************************
// PUNTO RECORRIDO RECOLECCION
// *********************************************************
export interface PuntoRecorridoRecoleccion {
  id_recoleccion: number;
  id_recorrido: number;
  id_ruta_punto: number;
  id_usuario: number;

  fecha_dispositivo: string;
  fecha_recepcion: string;

  latitud: string;
  longitud: string;
  precision_gps: string | null;
  distancia_punto_metros: string | null;
  dentro_radio_permitido: boolean | null;

  cantidad_recolectada: string | null;
  unidad_medida: string | null;
  observacion: string | null;
  clave_idempotencia: string;
  origen: string;
  estado_recoleccion: string;

  motivo_anulacion: string | null;
  fecha_anulacion: string | null;
  id_usuario_anulacion: number | null;

  created_at: string;
  updated_at: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetPuntosRecorridoResponse = ApiResponse<PuntoRecorridoData[]>;
