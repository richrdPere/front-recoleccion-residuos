import { ApiResponse } from "src/app/core/models/api-response.model";


export interface CapacidadRecorridoData {
  id_recorrido: number;
  estado_recorrido: string;
  vehiculo: CapacidadVehiculoData;
  capacidad: CapacidadResumenData;
  recolecciones: CapacidadRecoleccionesData;
}

export interface CapacidadVehiculoData {
  id_vehiculo: number;
  placa: string;
  capacidad_maxima: number;
  unidad_capacidad: string;
}

export interface CapacidadResumenData {
  cantidad_acumulada: number;
  capacidad_restante: number;
  cantidad_excedida: number;
  porcentaje: number;

  // Se mantiene como string hasta conocer todos los estados.
  estado: string;

  umbral_advertencia: number;
  capacidad_completa: boolean;
  existe_sobrecarga: boolean;
}

export interface CapacidadRecoleccionesData {
  total: number;
  con_cantidad: number;
  sin_cantidad: number;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetCapacidadRecorridoResponse = ApiResponse<CapacidadRecorridoData>;
