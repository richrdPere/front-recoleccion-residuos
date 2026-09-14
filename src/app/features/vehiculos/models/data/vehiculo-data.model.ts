import {
  EstadoOperativoVehiculo,
  TipoVehiculo,
  UnidadCapacidad,
} from './vehiculo.types';

export interface VehiculoData {
  id_vehiculo: number;

  codigo: string;
  placa: string;

  marca: string;
  modelo: string;

  anio: number | null;
  color: string | null;

  tipo_vehiculo: TipoVehiculo;

  capacidad_maxima: number;
  unidad_capacidad: UnidadCapacidad;

  kilometraje: number;

  estado_operativo: EstadoOperativoVehiculo;
  observacion: string | null;
  foto_url: string | null;

  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
