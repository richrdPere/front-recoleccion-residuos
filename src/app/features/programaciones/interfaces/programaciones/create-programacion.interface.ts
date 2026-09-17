// Contrato exclusivo del endpoint de creacion de programaciones.
// Fechas/horas son strings; DECIMAL se conserva como string en la respuesta.
// Los catalogos no proporcionados se mantienen como string.

import { ApiResponse } from "src/app/core/models/api-response.model";



export interface CreateProgramacionRegistro {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type CreateProgramacionCoordenada = [longitud: number, latitud: number];

export interface CreateProgramacionPolygon {
  type: 'Polygon';
  coordinates: CreateProgramacionCoordenada[][];
}

export interface CreateProgramacionLineString {
  type: 'LineString';
  coordinates: CreateProgramacionCoordenada[];
}

export interface CreateProgramacionData extends CreateProgramacionRegistro {
  id_programacion: number;
  id_ruta: number;
  id_ruta_version: number;
  id_vehiculo: number;
  id_usuario_creacion: number;
  fecha_programada: string;
  hora_inicio_programada: string;
  hora_fin_programada: string;
  turno: string;
  estado_programacion: string;
  observacion: string | null;
  motivo_cancelacion: string | null;
  fecha_cancelacion: string | null;
  ruta: CreateProgramacionRuta;
  version_ruta: CreateProgramacionVersionRuta;
  vehiculo: CreateProgramacionVehiculo;
  creador: CreateProgramacionCreador;
  personal_asignado: CreateProgramacionPersonalAsignado[];
  historial: CreateProgramacionHistorial[];
}

export interface CreateProgramacionRuta extends CreateProgramacionRegistro {
  id_ruta: number;
  id_zona: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  estado_ruta: 'BORRADOR' | 'ACTIVA' | 'INACTIVA';
  estado: boolean;
  zona: CreateProgramacionZona;
}

export interface CreateProgramacionZona extends CreateProgramacionRegistro {
  id_zona: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  poligono_geojson: CreateProgramacionPolygon | null;
  centro_latitud: string | null;
  centro_longitud: string | null;
  estado: boolean;
}

export interface CreateProgramacionVersionRuta extends CreateProgramacionRegistro {
  id_ruta_version: number;
  id_ruta: number;
  numero_version: number;
  geometria_geojson: CreateProgramacionLineString | null;
  distancia_estimada_km: string;
  duracion_estimada_min: number;
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta: string | null;
  vigente: boolean;
  observacion: string | null;
  estado: boolean;
  puntos: CreateProgramacionPunto[];
}

export interface CreateProgramacionPunto extends CreateProgramacionRegistro {
  id_ruta_punto: number;
  id_ruta_version: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo_punto: string;
  latitud: string;
  longitud: string;
  orden: number;
  radio_atencion_metros: number;
  tiempo_estimado_min: number;
  obligatorio: boolean;
  estado: boolean;
}

export interface CreateProgramacionVehiculo extends CreateProgramacionRegistro {
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
}

export interface CreateProgramacionCreador {
  id_usuario: number;
  username: string;
  email_acceso: string;
  persona: {
    id_persona: number;
    nombres: string;
    apellidos: string;
  };
}

export interface CreateProgramacionPersonalAsignado extends CreateProgramacionRegistro {
  id_programacion_personal: number;
  id_programacion: number;
  id_personal: number;
  funcion: string;
  es_principal: boolean;
  estado_asignacion: string;
  fecha_respuesta: string | null;
  observacion: string | null;
  personal: CreateProgramacionPersonal;
}

export interface CreateProgramacionPersonal extends CreateProgramacionRegistro {
  id_personal: number;
  id_usuario: number;
  codigo_empleado: string;
  fecha_ingreso: string;
  fecha_salida: string | null;
  tipo_contrato: string;
  turno_preferente: string;
  estado_laboral: string;
  observacion: string | null;
  estado: boolean;
  usuario: CreateProgramacionUsuarioPersonal;
  conductor: CreateProgramacionConductor | null;
}

export interface CreateProgramacionUsuarioPersonal {
  id_usuario: number;
  username: string;
  email_acceso: string;
  persona: {
    nombres: string;
    apellidos: string;
    numero_documento: string;
    celular: string | null;
  };
}

export interface CreateProgramacionConductor extends CreateProgramacionRegistro {
  id_conductor: number;
  id_personal: number;
  numero_licencia: string;
  categoria_licencia: string;
  fecha_emision_licencia: string;
  fecha_vencimiento_licencia: string;
  estado_licencia: string;
  restricciones: string | null;
  observacion: string | null;
  estado: boolean;
}

export interface CreateProgramacionHistorial {
  id_historial: number;
  id_programacion: number;
  id_usuario: number;
  tipo_evento: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  datos_anteriores: Record<string, unknown> | null;
  datos_nuevos: CreateProgramacionHistorialDatos;
  observacion: string | null;
  origen: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  actor: {
    id_usuario: number;
    username: string;
  };
}

export interface CreateProgramacionHistorialDatos {
  equipo: CreateProgramacionEquipoItem[];
  id_ruta: number;
  id_vehiculo: number;
  id_ruta_version: number;
  fecha_programada: string;
  hora_fin_programada: string;
  hora_inicio_programada: string;
}

export interface CreateProgramacionEquipoItem {
  funcion: string;
  id_personal: number;
  es_principal: boolean;
}


/** Modelo de envio exclusivo para crear una programacion.
 * No valida reglas de negocio ni transforma las fechas a UTC.
 * Copia el arreglo y limita el JSON a los campos aceptados del request.
 */
export class CreateProgramacionModel {
  private readonly request: CreateProgramacionRequest;

  constructor(request: CreateProgramacionRequest) {
    this.request = {
      id_ruta: request.id_ruta,
      id_ruta_version: request.id_ruta_version,
      id_vehiculo: request.id_vehiculo,
      id_conductor: request.id_conductor,
      recolectores: [...request.recolectores],
      id_supervisor: request.id_supervisor,
      fecha_programada: request.fecha_programada,
      hora_inicio_programada: request.hora_inicio_programada,
      hora_fin_programada: request.hora_fin_programada,
      turno: request.turno,
      observacion: request.observacion,
    };
  }

  toJson(): CreateProgramacionRequest {
    return {
      ...this.request,
      recolectores: [...this.request.recolectores],
    };
  }
}

// ==========================================================
// REQUEST
// ==========================================================
export interface CreateProgramacionRequest {
  id_ruta: number;
  id_ruta_version: number;
  id_vehiculo: number;
  /** ID de PersonalOperativo, NO el PK del perfil de conductor. */
  id_conductor: number;
  /** IDs de PersonalOperativo. */
  recolectores: number[];
  /** ID de PersonalOperativo; null cuando no hay supervisor. */
  id_supervisor: number | null;
  fecha_programada: string;
  hora_inicio_programada: string;
  hora_fin_programada: string;
  turno: string;
  observacion: string | null;
}

// ==========================================================
// RESPONSE
// ==========================================================
export type CreateProgramacionResponse = ApiResponse<CreateProgramacionData>;
