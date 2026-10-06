// Ajusta la ruta al archivo de interfaces anterior.
import {
  MantenimientoDetalleData,
  MantenimientoIdentificador,
  TipoMantenimiento,
} from './create-mantenimiento.interface';

// *********************************************************
// SOLICITUD
// *********************************************************

export interface UpdateMantenimientoRequest {
  tipo_mantenimiento?: TipoMantenimiento;

  // ISO 8601 con zona horaria explícita.
  fecha_inicio_programada?: string;
  fecha_fin_programada?: string;

  motivo?: string;
  diagnostico?: string | null;
  taller?: string | null;
  responsable_tecnico?: string | null;
  observacion?: string | null;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export interface UpdateMantenimientoResponse {
  success: boolean;
  message: string;
  data: MantenimientoDetalleData;
}
