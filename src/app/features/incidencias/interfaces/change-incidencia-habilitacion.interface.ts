import { IncidenciaDetalleData } from "./get-incidencia-detalle.interface";

export interface ChangeIncidenciaHabilitacionResponse {
  success: boolean;
  message: string;
  data: IncidenciaDetalleData;
}

export interface ChangeIncidenciaHabilitacionRequest {
  estado: boolean;
}
