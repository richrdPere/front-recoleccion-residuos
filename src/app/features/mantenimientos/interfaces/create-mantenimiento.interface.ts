// *********************************************************
// TIPOS
// *********************************************************

export type MantenimientoIdentificador = number | string;

export type MantenimientoDecimal = number | string;

export type TipoMantenimiento =
  | 'PREVENTIVO'
  | 'CORRECTIVO';

export type EstadoMantenimiento =
  | 'PROGRAMADO'
  | 'EN_PROCESO'
  | 'FINALIZADO'
  | 'CANCELADO';

export type MantenimientoTipoEvento =
  | 'CREACION'
  | 'ACTUALIZACION'
  | 'INICIO'
  | 'FINALIZACION'
  | 'CANCELACION';

export type MantenimientoEstadoOperativoVehiculo =
  | 'DISPONIBLE'
  | 'ASIGNADO'
  | 'EN_RUTA'
  | 'EN_MANTENIMIENTO'
  | 'FUERA_DE_SERVICIO';

// *********************************************************
// SOLICITUD
// *********************************************************

export interface CreateMantenimientoRequest {
  id_vehiculo: MantenimientoIdentificador;
  tipo_mantenimiento: TipoMantenimiento;

  // ISO 8601 con zona horaria explícita.
  fecha_inicio_programada: string;
  fecha_fin_programada: string;

  motivo: string;
  taller?: string | null;
  responsable_tecnico?: string | null;
  observacion?: string | null;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export interface CreateMantenimientoResponse {
  success: boolean;
  message: string;
  data: MantenimientoDetalleData;
}

// *********************************************************
// DATOS DEL MANTENIMIENTO
// *********************************************************

export interface MantenimientoData {
  id_mantenimiento: MantenimientoIdentificador;
  id_vehiculo: MantenimientoIdentificador;

  id_usuario_creacion: MantenimientoIdentificador;
  id_usuario_inicio: MantenimientoIdentificador | null;
  id_usuario_finalizacion: MantenimientoIdentificador | null;
  id_usuario_cancelacion: MantenimientoIdentificador | null;

  tipo_mantenimiento: TipoMantenimiento;
  estado_mantenimiento: EstadoMantenimiento;

  fecha_inicio_programada: string;
  fecha_fin_programada: string;
  fecha_inicio_real: string | null;
  fecha_fin_real: string | null;

  kilometraje_ingreso: MantenimientoDecimal | null;
  kilometraje_salida: MantenimientoDecimal | null;

  motivo: string;
  diagnostico: string | null;
  trabajos_realizados: string | null;

  taller: string | null;
  responsable_tecnico: string | null;
  costo_total: MantenimientoDecimal | null;

  vehiculo_operativo: boolean | null;

  motivo_cancelacion: string | null;
  fecha_cancelacion: string | null;
  observacion: string | null;

  created_at: string;
  updated_at: string;
}

// *********************************************************
// DETALLE CON RELACIONES
// *********************************************************

export interface MantenimientoDetalleData
  extends MantenimientoData {
  vehiculo: MantenimientoVehiculo;

  creador: MantenimientoUsuario | null;
  usuario_inicio: MantenimientoUsuario | null;
  usuario_finalizacion: MantenimientoUsuario | null;
  usuario_cancelacion: MantenimientoUsuario | null;

  historial: MantenimientoHistorialItem[];
}

// *********************************************************
// VEHÍCULO
// *********************************************************

export interface MantenimientoVehiculo {
  id_vehiculo: MantenimientoIdentificador;
  codigo: string;
  placa: string;
  marca: string;
  modelo: string;

  kilometraje: MantenimientoDecimal;
  estado_operativo: MantenimientoEstadoOperativoVehiculo;
  estado: boolean;
}

// *********************************************************
// USUARIO RESPONSABLE
// *********************************************************

export interface MantenimientoUsuario {
  id_usuario: MantenimientoIdentificador;
  username: string;
  email_acceso: string;
}

// *********************************************************
// HISTORIAL
// *********************************************************

export interface MantenimientoHistorialItem {
  id_historial: MantenimientoIdentificador;
  id_mantenimiento: MantenimientoIdentificador;
  id_usuario: MantenimientoIdentificador;

  tipo_evento: MantenimientoTipoEvento;
  estado_anterior: EstadoMantenimiento | null;
  estado_nuevo: EstadoMantenimiento;

  // Las instantáneas pueden contener solo algunos campos.
  datos_anteriores: Partial<MantenimientoData> | null;
  datos_nuevos: Partial<MantenimientoData> | null;

  observacion: string | null;
  created_at: string;

  actor: MantenimientoUsuario | null;
}
