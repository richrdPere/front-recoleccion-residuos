export type TipoVehiculo =
  | 'CAMION_COMPACTADOR'
  | 'CAMION_BARANDA'
  | 'CAMION_VOLQUETE'
  | 'MOTOFURGON'
  | 'OTRO';

export type UnidadCapacidad =
  | 'TONELADA'
  | 'KILOGRAMO'
  | 'METRO_CUBICO';

export type EstadoOperativoVehiculo =
  | 'DISPONIBLE'
  | 'EN_RUTA'
  | 'EN_MANTENIMIENTO'
  | 'FUERA_DE_SERVICIO';
