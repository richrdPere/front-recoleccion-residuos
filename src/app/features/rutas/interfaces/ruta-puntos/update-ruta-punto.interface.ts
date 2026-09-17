import { ApiResponse } from 'src/app/core/models/api-response.model';
import { RutaPuntoData } from '../rutas';
import { TipoRutaPunto } from './create-ruta-punto.interface';

// *********************************************************
// REQUEST PARA ACTUALIZAR PUNTO
// *********************************************************
export interface UpdateRutaPuntoRequest {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  tipo_punto?: TipoRutaPunto;

  latitud?: number;
  longitud?: number;

  orden?: number;
  radio_atencion_metros?: number;
  tiempo_estimado_min?: number;

  obligatorio?: boolean;
}

// *********************************************************
// PUNTO ACTUALIZADO
// *********************************************************
export interface UpdateRutaPuntoData
  extends Omit<RutaPuntoData, 'latitud' | 'longitud'> {
  latitud: string | number;
  longitud: string | number;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type UpdateRutaPuntoResponse = ApiResponse<UpdateRutaPuntoData>;
