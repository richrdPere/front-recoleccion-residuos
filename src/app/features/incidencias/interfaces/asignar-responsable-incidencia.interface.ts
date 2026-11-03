import { IncidenciaDetalleData } from "./get-incidencia-detalle.interface";
import { IncidenciaId } from "./get-incidencias-paginado.interface";


export interface AsignarResponsableIncidenciaRequest {
  /**
   * Identificador de Usuario.
   * Enviar null para retirar al responsable.
   */
  id_responsable: IncidenciaId | null;
}

export interface AsignarResponsableIncidenciaResponse {
  success: boolean;
  message: string;
  data: IncidenciaDetalleData;
}
