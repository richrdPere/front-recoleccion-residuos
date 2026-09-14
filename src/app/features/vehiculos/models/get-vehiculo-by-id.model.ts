import { ApiResponse } from "src/app/core/models/api-response.model";
import { VehiculoData } from "./data/vehiculo-data.model";

// ============================================================
// RESPONSE
// ============================================================

export type GetVehiculoByIdResponse = ApiResponse<VehiculoData>;

