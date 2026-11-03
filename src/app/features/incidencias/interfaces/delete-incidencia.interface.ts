export interface DeleteIncidenciaData {
  id_incidencia: string;
  eliminado: boolean;
}

export interface DeleteIncidenciaResponse {
  success: boolean;
  message: string;
  data: DeleteIncidenciaData;
}
