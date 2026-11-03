import { IncidenciaId } from "./get-incidencias-paginado.interface";


export interface IncidenciaArchivoListadoItem {
  id_incidencia_archivo: IncidenciaId;
  id_incidencia: IncidenciaId;
  id_usuario_carga: IncidenciaId;

  tipo_archivo:
  | 'IMAGEN'
  | 'VIDEO'
  | 'AUDIO'
  | 'DOCUMENTO';

  nombre_original: string;
  mime_type: string;

  tamanio_bytes: number | string;
  descripcion: string | null;

  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface GetIncidenciaArchivosResponse {
  success: boolean;
  message: string;
  data: IncidenciaArchivoListadoItem[];
}
