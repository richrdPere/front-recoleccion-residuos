import {
  ApiResponse,
} from 'src/app/core/models/api-response.model';

import {
  PuntoRecorridoData,
} from 'src/app/features/recolecciones/interfaces';

// *********************************************************
// TIPOS
// *********************************************************
export type HistorialDecimal = string | number;

export type HistorialUnidadMedida =
  | 'KG'
  | 'TONELADA'
  | 'LITRO'
  | 'M3';

// *********************************************************
// RECORRIDO
// *********************************************************
export interface HistorialRecorridoDetalle {
  id_recorrido: number;

  estado_recorrido:
  | 'EN_CURSO'
  | 'PAUSADO'
  | 'FINALIZADO'
  | 'CANCELADO';

  fecha_hora_inicio: string;
  fecha_hora_finalizacion: string | null;

  kilometraje_inicio: HistorialDecimal | null;
  kilometraje_final: HistorialDecimal | null;

  distancia_recorrida_metros: HistorialDecimal | null;

  motivo_cancelacion: string | null;

  resultado_final: HistorialResultadoFinal | null;
}

// *********************************************************
// RESULTADO FINAL
// Según la estructura guardada por resultadoFinalService.
// *********************************************************
export interface HistorialResultadoFinal {
  cantidad_total: number;
  unidad_medida: HistorialUnidadMedida;
  observacion: string;

  fecha_dispositivo: string;
  fecha_recepcion: string;

  clave_idempotencia: string;
  id_usuario: number;

  vehiculo: HistorialVehiculoResultado | null;
  capacidad: HistorialCapacidadResultado | null;
}

export interface HistorialVehiculoResultado {
  id_vehiculo: number;
  placa: string;

  capacidad_maxima: HistorialDecimal | null;
  unidad_capacidad: string | null;
}

export interface HistorialCapacidadResultado {
  cantidad_acumulada: number;
  capacidad_restante: number;
  cantidad_excedida: number;

  porcentaje: number;

  estado:
  | 'NORMAL'
  | 'ADVERTENCIA'
  | 'COMPLETO'
  | 'SOBRECARGA';

  umbral_advertencia: number;

  capacidad_completa: boolean;
  existe_sobrecarga: boolean;

  evaluacion: 'FINAL';

  unidad_capacidad: HistorialUnidadMedida;
  capacidad_maxima: number;
}

// *********************************************************
// PROGRAMACIÓN
// *********************************************************
export interface HistorialProgramacionDetalle {
  id_programacion: number;
  id_ruta: number;
  id_ruta_version: number;
  id_vehiculo: number;

  /** Fecha civil: YYYY-MM-DD. */
  fecha_programada: string;

  turno: string;

  ruta: HistorialRutaDetalle | null;
  vehiculo: HistorialVehiculoDetalle | null;
}

export interface HistorialRutaDetalle {
  id_ruta: number;
  codigo: string;
  nombre: string;

  zona: HistorialZonaDetalle | null;
}

export interface HistorialZonaDetalle {
  id_zona: number;
  nombre: string;
}

export interface HistorialVehiculoDetalle {
  id_vehiculo: number;
  codigo: string;
  placa: string;

  capacidad_maxima: HistorialDecimal | null;
  unidad_capacidad: string | null;
}

// *********************************************************
// EQUIPO
// *********************************************************
export interface HistorialEquipoItem {
  id_personal: number;

  funcion: string;
  estado_asignacion: string;

  /** Nombre de usuario, no un objeto Usuario. */
  usuario: string | null;
}

// *********************************************************
// EVENTOS
// *********************************************************
export interface HistorialEventoItem {
  id_recorrido_evento: number;

  tipo_evento:
  | 'INICIO'
  | 'PAUSA'
  | 'REANUDACION'
  | 'FINALIZACION'
  | 'CANCELACION';

  fecha_evento: string;

  latitud: HistorialDecimal | null;
  longitud: HistorialDecimal | null;
  precision_gps: HistorialDecimal | null;

  observacion: string | null;

  usuario: HistorialEventoUsuario | null;
}

export interface HistorialEventoUsuario {
  id_usuario: number;
  username: string;
}

// *********************************************************
// TIEMPOS Y PAUSAS
// *********************************************************
export interface HistorialTiempos {
  total_segundos: number | null;
  pausa_segundos: number | null;
  operacion_segundos: number | null;

  pausas: HistorialPausa[];
  advertencias: string[];
}

export interface HistorialPausa {
  inicio: string;
  fin: string;

  duracion_segundos: number;

  /** La pausa seguía abierta al calcular los tiempos. */
  abierta: boolean;
}

// *********************************************************
// RESUMEN DE PUNTOS
// *********************************************************
export interface HistorialResumenPuntos {
  total: number;

  atendidos: number;
  omitidos: number;
  pendientes: number;
}

// *********************************************************
// INCIDENCIAS
// *********************************************************
export interface HistorialIncidenciaItem {
  id_incidencia: number;

  titulo: string;
  descripcion: string;

  tipo: string;
  prioridad: string;
  estado_incidencia: string;

  fecha_reporte: string;
  fecha_resolucion: string | null;
}

// *********************************************************
// DATA
// *********************************************************
export interface HistorialDetalle {
  recorrido: HistorialRecorridoDetalle;

  programacion: HistorialProgramacionDetalle;

  equipo: HistorialEquipoItem[];
  eventos: HistorialEventoItem[];

  tiempos: HistorialTiempos;

  puntos: PuntoRecorridoData[];
  resumen_puntos: HistorialResumenPuntos;

  incidencias: HistorialIncidenciaItem[];

  generado_en: string;
  nota_incidencias: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetHistorialDetalleResponse = ApiResponse<HistorialDetalle>;
