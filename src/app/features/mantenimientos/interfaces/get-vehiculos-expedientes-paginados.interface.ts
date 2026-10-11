import { ApiResponse } from 'src/app/core/models/api-response.model';

// *********************************************************
// TIPOS
// *********************************************************

// BIGINT puede llegar como número o cadena.
export type ExpedienteVehiculoIdentificador = number | string;

export type ExpedienteTipoVehiculo =
  | 'CAMION_COMPACTADOR'
  | 'CAMION_BARANDA'
  | 'CAMION_VOLQUETE'
  | 'MOTOFURGON'
  | 'OTRO';

export type ExpedienteEstadoOperativoVehiculo =
  | 'DISPONIBLE'
  | 'ASIGNADO'
  | 'EN_RUTA'
  | 'EN_MANTENIMIENTO'
  | 'FUERA_DE_SERVICIO';

export type VehiculosExpedientesSortBy =
  | 'id_vehiculo'
  | 'codigo'
  | 'placa'
  | 'marca'
  | 'modelo'
  | 'estado_operativo'
  | 'created_at'
  | 'updated_at';

export type VehiculosExpedientesSortOrder = 'ASC' | 'DESC';

// *********************************************************
// FILTROS
// *********************************************************

export interface VehiculosExpedientesPaginadosFilters {
  page?: number;
  limit?: number;
  search?: string;
  tipo_vehiculo?: ExpedienteTipoVehiculo;
  estado_operativo?: ExpedienteEstadoOperativoVehiculo;
  estado?: boolean;
  solo_con_mantenimientos?: boolean;
  sort_by?: VehiculosExpedientesSortBy;
  sort_order?: VehiculosExpedientesSortOrder;
}

// *********************************************************
// RESUMEN DEL EXPEDIENTE
// *********************************************************

export interface VehiculoExpedienteResumen {
  cantidad_mantenimientos: number;
  cantidad_programados: number;
  cantidad_en_proceso: number;
  cantidad_finalizados: number;
  cantidad_cancelados: number;

  cantidad_preventivos: number;
  cantidad_correctivos: number;

  fecha_ultimo_mantenimiento_finalizado: string | null;
  costo_total_finalizados: string;
  cantidad_finalizados_sin_costo: number;
}

// *********************************************************
// VEHÍCULO
// *********************************************************

export interface VehiculoExpedienteData {
  id_vehiculo: ExpedienteVehiculoIdentificador;

  codigo: string;
  placa: string;
  marca: string;
  modelo: string;

  anio: number | null;
  color: string | null;

  tipo_vehiculo: ExpedienteTipoVehiculo;
  foto_url: string | null;

  kilometraje: string;
  estado_operativo: ExpedienteEstadoOperativoVehiculo;
  estado: boolean;

  created_at: string;
  updated_at: string;

  expediente: VehiculoExpedienteResumen;
}

// *********************************************************
// PAGINACIÓN
// *********************************************************

export interface VehiculosExpedientesPagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// RESPONSE
// *********************************************************

export interface GetVehiculosExpedientesPaginadosData {
  vehiculos: VehiculoExpedienteData[];
  pagination: VehiculosExpedientesPagination;
}

export type GetVehiculosExpedientesPaginadosResponse =
  ApiResponse<GetVehiculosExpedientesPaginadosData>;
