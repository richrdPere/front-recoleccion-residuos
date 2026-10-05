// Ajusta la ruta a tu archivo de interfaces anterior.
import {
  MantenimientoDetalleData,
} from './create-mantenimiento.interface';

// *********************************************************
// RESPUESTA
// *********************************************************

export interface GetMantenimientoByIdResponse {
  success: boolean;
  message: string;
  data: MantenimientoDetalleData;
}
