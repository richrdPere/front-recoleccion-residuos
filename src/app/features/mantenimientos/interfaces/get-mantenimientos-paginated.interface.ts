// Ajusta la ruta al archivo de interfaces anterior.
import {
  MantenimientoData,
  MantenimientoIdentificador,
  MantenimientoEstadoOperativoVehiculo,
  TipoMantenimiento,
  EstadoMantenimiento,
} from './create-mantenimiento.interface';

// *********************************************************
// TIPOS DE ORDENAMIENTO
// *********************************************************

export type MantenimientosSortBy =
  | 'id_mantenimiento'
  | 'fecha_inicio_programada'
  | 'fecha_fin_programada'
  | 'estado_mantenimiento'
  | 'tipo_mantenimiento'
  | 'created_at'
  | 'updated_at';

export type MantenimientosSortOrder = 'ASC' | 'DESC';

// *********************************************************
// FILTROS
// *********************************************************

export interface MantenimientosPaginadosFilters {
  page?: number;
  limit?: number;
  search?: string;

  id_vehiculo?: MantenimientoIdentificador;
  tipo_mantenimiento?: TipoMantenimiento;
  estado_mantenimiento?: EstadoMantenimiento;

  // ISO 8601 con zona horaria explícita.
  fecha_inicio?: string;
  fecha_fin?: string;

  sort_by?: MantenimientosSortBy;
  sort_order?: MantenimientosSortOrder;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export interface GetMantenimientosPaginadosResponse {
  success: boolean;
  message: string;
  data: MantenimientosPaginadosData;
}

export interface MantenimientosPaginadosData {
  items: MantenimientoPaginadoItem[];
  pagination: MantenimientosPagination;
}

// *********************************************************
// ITEM DEL LISTADO
// *********************************************************

export interface MantenimientoPaginadoItem extends MantenimientoData {
  creador: any;
  vehiculo: MantenimientoVehiculoResumen;
}

// *********************************************************
// VEHÍCULO RESUMIDO
// *********************************************************

export interface MantenimientoVehiculoResumen {
  id_vehiculo: MantenimientoIdentificador;
  codigo: string;
  placa: string;
  estado_operativo: MantenimientoEstadoOperativoVehiculo;
}

// *********************************************************
// PAGINACIÓN
// *********************************************************

export interface MantenimientosPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
