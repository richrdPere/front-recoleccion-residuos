// Ajusta la ruta a tu archivo de interfaces.
import { MantenimientosPaginadosData, MantenimientosPaginadosFilters } from "./get-mantenimientos-paginated.interface";


// *********************************************************
// FILTROS
// *********************************************************

export type MantenimientosByVehiculoFilters = Omit<
  MantenimientosPaginadosFilters,
  'id_vehiculo'
>;

// *********************************************************
// RESPUESTA
// *********************************************************

export interface GetMantenimientosByVehiculoResponse {
  success: boolean;
  message: string;
  data: MantenimientosPaginadosData;
}
