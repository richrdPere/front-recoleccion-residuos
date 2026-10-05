// Ajusta la ruta a tu archivo de interfaces.
import {
  MantenimientoDecimal,
  MantenimientoDetalleData,
} from './create-mantenimiento.interface';

// *********************************************************
// SOLICITUD
// *********************************************************

export interface FinalizarMantenimientoRequest {
  trabajos_realizados: string;
  vehiculo_operativo: boolean;

  kilometraje_salida?: MantenimientoDecimal;
  diagnostico?: string | null;
  responsable_tecnico?: string | null;
  taller?: string | null;
  costo_total?: MantenimientoDecimal | null;
  observacion?: string | null;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export interface FinalizarMantenimientoResponse {
  success: boolean;
  message: string;
  data: MantenimientoDetalleData;
}
