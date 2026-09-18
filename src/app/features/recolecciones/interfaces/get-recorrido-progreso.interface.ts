import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// PUNTO RECORRIDO DATA
// *********************************************************
export interface RecorridoProgresoData {
  id_recorrido: number;

  total_puntos: number;
  puntos_atendidos: number;
  puntos_pendientes: number;

  puntos_obligatorios: number;
  obligatorios_atendidos: number;
  obligatorios_pendientes: number;

  porcentaje_progreso: number;
  ruta_completada: boolean;

  cantidades_por_unidad: Record<string, number>;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetRecorridoProgresoResponse = ApiResponse<RecorridoProgresoData>;

