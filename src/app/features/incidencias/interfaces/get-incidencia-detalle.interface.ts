import { IncidenciaArchivoData, IncidenciaListadoItem } from "./get-incidencias-paginado.interface";

export interface IncidenciaDetalleData
  extends IncidenciaListadoItem {
  archivos: IncidenciaArchivoData[];
}

export interface GetIncidenciaByIdResponse {
  success: boolean;
  message: string;
  data: IncidenciaDetalleData;
}
