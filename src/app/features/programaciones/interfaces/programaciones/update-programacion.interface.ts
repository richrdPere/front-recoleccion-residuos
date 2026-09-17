import { ApiResponse } from 'src/app/core/models/api-response.model';
import type {
  ProgramacionDetalleData,
} from './get-programacion-by-id.interface';

// *********************************************************
// REQUEST PARA ACTUALIZAR PROGRAMACIÓN
// *********************************************************
export interface UpdateProgramacionRequest {
  id_ruta?: number;
  id_ruta_version?: number;
  id_vehiculo?: number;

  // Identificadores de PersonalOperativo.
  id_conductor?: number;
  recolectores?: number[];
  id_supervisor?: number | null;

  // Formato: YYYY-MM-DD.
  fecha_programada?: string;

  // Formato: HH:mm:ss.
  hora_inicio_programada?: string;
  hora_fin_programada?: string;

  turno?: string;
  observacion?: string | null;
}

// *********************************************************
// RESPUESTA DE ACTUALIZACIÓN
// *********************************************************
export type UpdateProgramacionResponse = ApiResponse<ProgramacionDetalleData>;
