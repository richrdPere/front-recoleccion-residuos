// Ajusta las rutas a tus archivos de interfaces.
import { MantenimientoIdentificador, TipoMantenimiento } from './create-mantenimiento.interface';
import { MantenimientosPaginadosData } from './get-mantenimientos-paginated.interface';


// *********************************************************
// FILTROS
// *********************************************************

export interface MantenimientosProximosFilters {
  dias?: number;
  page?: number;
  limit?: number;
  id_vehiculo?: MantenimientoIdentificador;
  tipo_mantenimiento?: TipoMantenimiento;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export interface GetMantenimientosProximosResponse {
  success: boolean;
  message: string;
  data: MantenimientosPaginadosData;
}
