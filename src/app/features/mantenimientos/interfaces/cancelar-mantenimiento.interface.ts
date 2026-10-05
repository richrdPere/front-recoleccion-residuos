// Ajusta la ruta a tu archivo de interfaces.
import {
  MantenimientoDetalleData,
} from './create-mantenimiento.interface';

// *********************************************************
// SOLICITUD
// *********************************************************

export interface CancelarMantenimientoRequest {
  motivo_cancelacion: string;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export interface CancelarMantenimientoResponse {
  success: boolean;
  message: string;
  data: MantenimientoDetalleData;
}
