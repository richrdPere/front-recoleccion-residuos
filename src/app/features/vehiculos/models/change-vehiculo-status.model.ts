import { ApiResponse } from 'src/app/core/models/api-response.model';
import { EstadoOperativoVehiculo } from './data/vehiculo.types';
import { VehiculoData } from './data/vehiculo-data.model';

export interface ChangeVehiculoEstadoRequest {
  estado: boolean;
}

export interface ChangeVehiculoEstadoOperativoRequest {
  estado_operativo: EstadoOperativoVehiculo;

  observacion?: string | null;
}

// ==========================================================
// RESPONSE
// ==========================================================

export type ChangeVehiculoEstadoResponse = ApiResponse<VehiculoData>;
