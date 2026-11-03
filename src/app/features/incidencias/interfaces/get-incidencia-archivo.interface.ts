import { IncidenciaArchivoListadoItem } from "./get-incidencia-archivo-listado.incidencia";


export interface GetIncidenciaArchivoResponse {
  success: boolean;
  message: string;
  data: IncidenciaArchivoListadoItem;
}
