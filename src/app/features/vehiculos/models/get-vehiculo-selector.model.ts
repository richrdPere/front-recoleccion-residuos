// *********************************************************
// TIPOS
// *********************************************************

export type VehiculoSelectorIdentificador = number | string;

export type VehiculoSelectorEstadoOperativo =
  | 'DISPONIBLE'
  | 'ASIGNADO'
  | 'EN_RUTA'
  | 'EN_MANTENIMIENTO'
  | 'FUERA_DE_SERVICIO';

// *********************************************************
// FILTROS
// *********************************************************

export interface VehiculoSelectorFilters {
  search?: string;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export interface GetVehiculoSelectorResponse {
  success: boolean;
  message: string;
  data: VehiculoSelectorItem[];
}

// *********************************************************
// ITEM DEL SELECTOR
// *********************************************************

export interface VehiculoSelectorItem {
  id_vehiculo: VehiculoSelectorIdentificador;
  codigo: string;
  placa: string;
  marca: string;
  modelo: string;
  estado_operativo: VehiculoSelectorEstadoOperativo;
  label: string;
}
