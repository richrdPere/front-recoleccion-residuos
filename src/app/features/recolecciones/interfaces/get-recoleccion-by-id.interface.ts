import {
  PuntoRecorridoData,
  PuntoRecorridoRecoleccion,
} from './get-puntos-recorrido.interface';

import { RecoleccionEvidenciaData } from './anular-evidencia.interface';
import { RecorridoData } from '../../recorridos/interfaces';
import { ApiResponse } from 'src/app/core/models/api-response.model';

// *********************************************************
// DETALLE
// *********************************************************
export interface RecoleccionDetalleData
  extends PuntoRecorridoRecoleccion {
  recorrido: RecoleccionRecorridoData;
  punto_ruta: RecoleccionPuntoRutaData;
  usuario_registro: RecoleccionUsuarioRegistro;
  usuario_anulacion: RecoleccionUsuarioAnulacion | null;
  evidencias: RecoleccionEvidenciaData[];
}

// *********************************************************
// RECORRIDO SIN RELACIONES ANIDADAS
// *********************************************************
export type RecoleccionRecorridoData = Omit<
  RecorridoData,
  | 'programacion'
  | 'usuario_inicio'
  | 'usuario_finalizacion'
  | 'eventos'
>;

// *********************************************************
// PUNTO DE RUTA SIN ESTADO DE ATENCIÓN
// *********************************************************
export type RecoleccionPuntoRutaData = Omit<
  PuntoRecorridoData,
  'estado_atencion' | 'recoleccion'
>;

// *********************************************************
// USUARIOS
// *********************************************************
export interface RecoleccionUsuarioAnulacion {
  id_usuario: number;
  username: string;
}

export interface RecoleccionUsuarioRegistro
  extends RecoleccionUsuarioAnulacion {
  email_acceso: string;
}


// *********************************************************
// RESPONSE
// *********************************************************
export type GetRecoleccionByIdResponse = ApiResponse<RecoleccionDetalleData>;
