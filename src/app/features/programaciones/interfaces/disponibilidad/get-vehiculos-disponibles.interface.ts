import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// VEHÍCULO DISPONIBLE
// *********************************************************
export interface VehiculoDisponibleData {
  id_vehiculo: number;

  codigo: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;

  tipo_vehiculo: string;
  capacidad_maxima: string;
  unidad_capacidad: string;
  kilometraje: string;

  estado_operativo: string;
  observacion: string | null;
  foto_url: string | null;
  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type GetVehiculosDisponiblesResponse = ApiResponse<VehiculoDisponibleData[]>;
