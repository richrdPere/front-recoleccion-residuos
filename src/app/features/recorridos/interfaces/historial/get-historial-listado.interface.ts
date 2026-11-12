import {
  ApiResponse,
} from 'src/app/core/models/api-response.model';

// *********************************************************
// TIPOS
// *********************************************************
export type HistorialEstadoRecorrido =
  | 'EN_CURSO'
  | 'PAUSADO'
  | 'FINALIZADO'
  | 'CANCELADO';

export type HistorialSortOrder = 'ASC' | 'DESC';

// *********************************************************
// FILA DEL LISTADO
// *********************************************************
export interface HistorialFila {
  id_recorrido: number;
  id_programacion: number;

  id_ruta: number;
  ruta: string | null;

  id_zona: number | null;
  zona: string | null;

  id_vehiculo: number;
  placa: string | null;

  estado: HistorialEstadoRecorrido;

  /** Fechas ISO del servidor. */
  fecha_inicio: string;
  fecha_fin: string | null;

  duracion_segundos: number | null;

  /** MySQL DECIMAL puede recibirse como string. */
  distancia_recorrida_metros: number | string | null;

  id_usuario_inicio: number;
  id_usuario_finalizacion: number | null;

  puntos_total: number;
  puntos_atendidos: number;
}

// El backend permite ordenar por cualquiera
// de las columnas del listado.
export type HistorialSortBy = keyof HistorialFila;

// *********************************************************
// FILTROS DE DATOS
// *********************************************************
export interface HistorialFiltrosBase {
  /** Obligatoria. Formato YYYY-MM-DD. */
  fecha_inicio: string;

  /** Obligatoria. Formato YYYY-MM-DD. */
  fecha_fin: string;

  id_zona?: number;
  id_ruta?: number;
  id_vehiculo?: number;
  id_programacion?: number;
  id_recorrido?: number;

  /** Usuario que inició el recorrido. */
  id_usuario?: number;

  estado?: HistorialEstadoRecorrido;

  /** Se aplica sobre el turno de la programación. */
  turno?: string;
}

// *********************************************************
// FILTROS DE CONSULTA
// *********************************************************
export interface GetHistorialListadoFilters
  extends HistorialFiltrosBase {
  /** Predeterminado: 1. Máximo: 1 000 000. */
  page?: number;

  /** Predeterminado: 20. Rango: 1 a 100. */
  limit?: number;

  /** Predeterminado: fecha_inicio. */
  sort_by?: HistorialSortBy;

  /** Predeterminado: DESC. */
  sort_order?: HistorialSortOrder;
}

// *********************************************************
// COLUMNAS
// *********************************************************
export interface HistorialColumna {
  key: HistorialSortBy;
  titulo: string;
}

// *********************************************************
// RESUMEN
// *********************************************************
export interface HistorialResumenEstado {
  estado: HistorialEstadoRecorrido;
  total: number;
}

export interface HistorialResumen {
  /** Total de recorridos que cumplen los filtros. */
  total: number;

  por_estado: HistorialResumenEstado[];
}

// *********************************************************
// PAGINACIÓN
// *********************************************************
export interface HistorialPagination {
  page: number;
  limit: number;

  total: number;
  total_pages: number;

  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// METADATA
// *********************************************************
export interface HistorialMetadata {
  zona_horaria: 'America/Lima';
  generado_por: number;

  orden: {
    sort_by: HistorialSortBy;
    sort_order: HistorialSortOrder;
  };

  base_fecha: string;
  generado_en: string;

  alcance: 'PAGINA';
}

// *********************************************************
// DATA
// *********************************************************
export interface HistorialListado {
  tipo_reporte: 'RECORRIDOS';

  filtros_aplicados: HistorialFiltrosBase;

  columnas: HistorialColumna[];
  items: HistorialFila[];

  resumen: HistorialResumen;
  pagination: HistorialPagination;
  metadata: HistorialMetadata;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetHistorialListadoResponse = ApiResponse<HistorialListado>;
