import { ApiResponse } from 'src/app/core/models/api-response.model';
import { CreateVehiculoRequest } from './create-vehiculo.model';
import { VehiculoData } from './data/vehiculo-data.model';

// ============================================================
// REQUEST
// ============================================================
export type UpdateVehiculoRequest = Partial<CreateVehiculoRequest>;

// ============================================================
// RESPONSE
// ============================================================
export type UpdateVehiculoResponse = ApiResponse<VehiculoData>;
