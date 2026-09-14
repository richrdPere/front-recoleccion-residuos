import { ApiResponse } from 'src/app/core/models/api-response.model';
import { EstadoOperativoVehiculo, TipoVehiculo, UnidadCapacidad } from './data/vehiculo.types';
import { VehiculoData } from './data/vehiculo-data.model';

// ============================================================
// REQUEST
// ============================================================
export interface CreateVehiculoRequest {
  codigo: string;
  placa: string;

  marca: string;
  modelo: string;

  anio: number;
  color: string;

  tipo_vehiculo: TipoVehiculo;

  capacidad_maxima: number;
  unidad_capacidad: UnidadCapacidad;

  kilometraje: number;

  estado_operativo: EstadoOperativoVehiculo;

  observacion?: string | null;
  estado?: boolean;
}

// ============================================================
// RESPONSE
// ============================================================
export type CreateVehiculoResponse = ApiResponse<VehiculoData>;
