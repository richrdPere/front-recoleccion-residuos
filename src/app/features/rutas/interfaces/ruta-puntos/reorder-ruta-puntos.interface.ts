// Ajusta la ruta según tu estructura.
import { ApiResponse } from 'src/app/core/models/api-response.model';
import { RutaPuntoData } from '../rutas';

// *********************************************************
// ORDEN DE CADA PUNTO
// *********************************************************
export interface ReorderRutaPuntoItem {
  id_ruta_punto: number;
  orden: number;
}

// *********************************************************
// REQUEST PARA REORDENAR PUNTOS
// *********************************************************
export interface ReorderRutaPuntosRequest {
  puntos: ReorderRutaPuntoItem[];
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type ReorderRutaPuntosResponse = ApiResponse<RutaPuntoData[]>;
