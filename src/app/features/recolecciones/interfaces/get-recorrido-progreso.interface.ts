import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// PUNTO RECORRIDO DATA
// *********************************************************
export interface RecorridoProgresoData {
  id_recorrido: number;

  total_puntos: number;
  puntos_atendidos: number;
  puntos_omitidos: number;
  puntos_pendientes: number;

  puntos_obligatorios: number;
  obligatorios_atendidos: number;
  obligatorios_omitidos: number;
  obligatorios_pendientes: number;
  obligatorios_no_atendidos: number;

  porcentaje_progreso: number;
  porcentaje_atencion: number;
  porcentaje_gestion: number;

  ruta_completada: boolean;
  gestion_completada: boolean;

  cantidades_por_punto: Record<string, number>;
  cantidades_por_unidad: Record<string, number>;

  resultado_final_pendiente: boolean;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetRecorridoProgresoResponse = ApiResponse<RecorridoProgresoData>;

