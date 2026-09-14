import { ApiResponse } from 'src/app/core/models/api-response.model';
import { VehiculoData } from './data/vehiculo-data.model';
import { EstadoOperativoVehiculo, TipoVehiculo, UnidadCapacidad } from './data/vehiculo.types';

// ============================================================
// FILTROS
// ============================================================
export interface VehiculosPaginadosFilters {
  page?: number;
  limit?: number;

  search?: string;
  estado?: boolean;
  estado_operativo?: EstadoOperativoVehiculo;
  tipo_vehiculo?: TipoVehiculo;

  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';

  // codigo?: string;
  // placa?: string;
  // marca?: string;
  // modelo?: string;
  // anio?: number;
  // unidad_capacidad?: UnidadCapacidad;
}


// ============================================================
// DATA PAGINADA
// ============================================================
export interface GetVehiculosPaginatedData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: VehiculoData[];
}

// ============================================================
// ULTIMO CODIGO
// ============================================================
export interface UltimoCodigoData {
  codigo: string;
}

// ============================================================
// RESPONSE
// ============================================================
export type GetVehiculosPaginatedResponse = ApiResponse<GetVehiculosPaginatedData>;

export type UltimoCodigoResponse = ApiResponse<UltimoCodigoData>;
