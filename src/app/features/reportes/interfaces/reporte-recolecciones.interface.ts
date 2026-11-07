import { ApiResponse } from 'src/app/core/models/api-response.model';

import {
  ReporteUnidadMedida,
  ReporteResumenRecolecciones,
  ReporteResumenFilters,
  ReporteResumenFiltrosAplicados,
} from './reporte-resumen.interface';

// *********************************************************
// 1. FILTROS
// *********************************************************
export interface ReporteRecoleccionesFilters
  extends ReporteResumenFilters {

  id_programacion?: number | null;
  id_recorrido?: number | null;

  /** Usuario que registró el resultado final. */
  id_usuario?: number | null;

  unidad_medida?: ReporteUnidadMedida | null;

  page?: number | null;
  limit?: number | null;

  sort_by?: ReporteRecoleccionesColumnaKey | null;
  sort_order?: 'ASC' | 'DESC' | null;
}

// *********************************************************
// 2. FILTROS APLICADOS
// *********************************************************
export interface ReporteRecoleccionesFiltrosAplicados
  extends ReporteResumenFiltrosAplicados {

  id_programacion?: number;
  id_recorrido?: number;
  id_usuario?: number;

  unidad_medida?: ReporteUnidadMedida;
}

// *********************************************************
// 3. REGISTRO DEL REPORTE
// *********************************************************
export interface ReporteRecoleccionItem {
  id_recorrido: number;
  id_programacion: number;

  id_ruta: number;
  ruta: string | null;

  id_zona: number | null;
  zona: string | null;

  id_vehiculo: number;
  placa: string | null;

  /** Este reporte consulta recorridos finalizados. */
  estado: 'FINALIZADO';

  /** Fecha ISO de finalización del recorrido. */
  fecha_fin: string;

  /**
   * DECIMAL de MySQL, por ejemplo "25.000".
   * null cuando no existe una cantidad registrada.
   */
  cantidad_total: string | null;

  unidad_medida: ReporteUnidadMedida | null;

  /**
   * El backend utiliza JSON_UNQUOTE:
   * el identificador llega como texto.
   */
  id_usuario_registro: string | null;

  /** Fecha ISO de captura del resultado final. */
  fecha_medicion: string | null;

  /** 1: falta resultado final. 0: existe resultado final. */
  resultado_pendiente: 0 | 1;
}

// *********************************************************
// 4. COLUMNAS
// *********************************************************
export type ReporteRecoleccionesColumnaKey =
  keyof ReporteRecoleccionItem;

export interface ReporteRecoleccionesColumna {
  key: ReporteRecoleccionesColumnaKey;
  titulo: string;
}

// *********************************************************
// 5. PAGINACIÓN
// *********************************************************
export interface ReporteRecoleccionesPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// 6. ORDENAMIENTO
// *********************************************************
export interface ReporteRecoleccionesOrden {
  sort_by: ReporteRecoleccionesColumnaKey;
  sort_order: 'ASC' | 'DESC';
}

// *********************************************************
// 7. METADATA
// *********************************************************
export interface ReporteRecoleccionesMetadata {
  zona_horaria: 'America/Lima';
  generado_por: number;

  orden: ReporteRecoleccionesOrden;

  base_fecha: string;
  generado_en: string;

  alcance: 'PAGINA';
}

// *********************************************************
// 8. DATA DEL ENDPOINT
// *********************************************************
export interface ReporteRecoleccionesData {
  tipo_reporte: 'RECOLECCIONES';

  filtros_aplicados:
  ReporteRecoleccionesFiltrosAplicados;

  columnas: ReporteRecoleccionesColumna[];

  items: ReporteRecoleccionItem[];

  resumen: ReporteResumenRecolecciones;

  pagination: ReporteRecoleccionesPagination;

  metadata: ReporteRecoleccionesMetadata;
}

// *********************************************************
// 9. RESPUESTA
// *********************************************************
export type GetReporteRecoleccionesResponse = ApiResponse<ReporteRecoleccionesData>;
