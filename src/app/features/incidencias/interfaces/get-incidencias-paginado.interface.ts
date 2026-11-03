// *********************************************************
// TIPOS GENERALES
// *********************************************************

export type IncidenciaId = number | string;

export type IncidenciaTipo =
  | 'VIA_BLOQUEADA'
  | 'AVERIA_VEHICULO'
  | 'ACCIDENTE'
  | 'RECOLECCION_NO_REALIZADA'
  | 'ACUMULACION_RESIDUOS'
  | 'PUNTO_INACCESIBLE'
  | 'OTRO';

export type IncidenciaPrioridad =
  | 'BAJA'
  | 'MEDIA'
  | 'ALTA'
  | 'CRITICA';

export type IncidenciaOrigen =
  | 'APP_OPERATIVA'
  | 'APP_CIUDADANA'
  | 'WEB_MUNICIPAL'
  | 'WEB_CIUDADANA';

export type IncidenciaEstado =
  | 'REPORTADA'
  | 'EN_REVISION'
  | 'EN_ATENCION'
  | 'RESUELTA'
  | 'RECHAZADA'
  | 'CANCELADA';

export type IncidenciasSortBy =
  | 'id_incidencia'
  | 'fecha_reporte'
  | 'created_at'
  | 'updated_at'
  | 'titulo'
  | 'tipo'
  | 'prioridad'
  | 'estado_incidencia';

export type IncidenciasSortOrder = 'ASC' | 'DESC';

export interface IncidenciaArchivoData {
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
}

// *********************************************************
// FILTROS DEL LISTADO PAGINADO
// *********************************************************

export interface IncidenciasPaginadasFilters {
  page?: number;
  limit?: number;
  search?: string;

  tipo?: IncidenciaTipo;
  prioridad?: IncidenciaPrioridad;
  origen?: IncidenciaOrigen;
  estado_incidencia?: IncidenciaEstado;

  /** Habilitación administrativa, distinta del estado de atención. */
  estado?: boolean;

  id_usuario_reporte?: IncidenciaId;
  id_responsable?: IncidenciaId;
  id_recorrido?: IncidenciaId;
  id_zona?: IncidenciaId;
  id_ruta?: IncidenciaId;

  /** YYYY-MM-DD o timestamp ISO con zona horaria. */
  fecha_desde?: string;

  /** YYYY-MM-DD o timestamp ISO con zona horaria. */
  fecha_hasta?: string;

  sort_by?: IncidenciasSortBy;
  sort_order?: IncidenciasSortOrder;
}

// *********************************************************
// ASOCIACIONES
// *********************************************************

export interface IncidenciaUsuarioResumen {
  id_usuario: IncidenciaId;
  username: string;
}

export interface IncidenciaZonaResumen {
  id_zona: IncidenciaId;
  codigo: string;
  nombre: string;
}

export interface IncidenciaRutaResumen {
  id_ruta: IncidenciaId;
  codigo: string;
  nombre: string;
}

export interface IncidenciaRecorridoResumen {
  id_recorrido: IncidenciaId;

  estado_recorrido:
  | 'EN_CURSO'
  | 'PAUSADO'
  | 'FINALIZADO'
  | 'CANCELADO';
}

// *********************************************************
// ITEM DEL LISTADO PAGINADO
// *********************************************************

export interface IncidenciaListadoItem {
  id_incidencia: IncidenciaId;

  id_usuario_reporte: IncidenciaId;
  id_responsable: IncidenciaId | null;

  id_recorrido: IncidenciaId | null;
  id_zona: IncidenciaId | null;
  id_ruta: IncidenciaId | null;

  tipo: IncidenciaTipo;
  prioridad: IncidenciaPrioridad;

  titulo: string;
  descripcion: string;

  origen: IncidenciaOrigen;
  estado_incidencia: IncidenciaEstado;

  fecha_reporte: string;
  fecha_resolucion: string | null;
  detalle_resolucion: string | null;

  // Sequelize devuelve estos DECIMAL como cadenas.
  latitud: string | null;
  longitud: string | null;
  precision_ubicacion: string | null;

  direccion_referencia: string | null;

  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  reportante: IncidenciaUsuarioResumen | null;
  responsable: IncidenciaUsuarioResumen | null;

  zona: IncidenciaZonaResumen | null;
  ruta: IncidenciaRutaResumen | null;
  recorrido: IncidenciaRecorridoResumen | null;
}

// *********************************************************
// PAGINACIÓN
// *********************************************************

export interface IncidenciasPagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// *********************************************************
// DATA DEL LISTADO
// *********************************************************

export interface IncidenciasPaginadasData {
  items: IncidenciaListadoItem[];
  pagination: IncidenciasPagination;
}

// *********************************************************
// RESPONSE: OBTENER INCIDENCIAS PAGINADAS
// *********************************************************

export interface GetIncidenciasPaginatedResponse {
  success: boolean;
  message: string;
  data: IncidenciasPaginadasData;
}
