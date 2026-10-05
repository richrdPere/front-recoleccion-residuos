// Ajusta la ruta a tu archivo de interfaces.
import {
  MantenimientoDecimal,
  MantenimientoDetalleData,
} from './create-mantenimiento.interface';

// *********************************************************
// SOLICITUD
// *********************************************************

export interface IniciarMantenimientoRequest {
  kilometraje_ingreso?: MantenimientoDecimal;

  // ISO 8601 con zona horaria explícita.
  fecha_fin_programada?: string;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export interface IniciarMantenimientoResponse {
  success: boolean;
  message: string;
  data: MantenimientoDetalleData;
}
