import { ApiResponse } from 'src/app/core/models/api-response.model';
import type { ProgramacionDetalleData } from './get-programacion-by-id.interface';

// *********************************************************
// REQUEST PARA CANCELAR PROGRAMACIÓN
// *********************************************************
export interface CancelProgramacionRequest {
  motivo_cancelacion: string;
}

// *********************************************************
// RESPUESTA DE CANCELACIÓN
// *********************************************************
export type CancelProgramacionResponse = ApiResponse<ProgramacionDetalleData>;
