import { IncidenciaDetalleData } from "./get-incidencia-detalle.interface";
import { IncidenciaEstado } from "./get-incidencias-paginado.interface";

export interface ChangeIncidenciaEstadoRequest {
  estado_incidencia: IncidenciaEstado;

  /**
   * Obligatorio para RESUELTA, RECHAZADA y CANCELADA.
   * Omitir para los demás estados.
   */
  detalle_resolucion?: string;
}


export interface ChangeIncidenciaEstadoResponse {
  success: boolean;
  message: string;
  data: IncidenciaDetalleData;
}
