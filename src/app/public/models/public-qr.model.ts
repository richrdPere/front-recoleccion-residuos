export type PublicId = number | string;

export interface PublicLineString {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface PublicRoute {
  id_ruta: PublicId;
  nombre: string;
  codigo: string;
  color: string;

  zona: {
    id_zona: PublicId | null;
    nombre: string;
  };

  id_ruta_version: PublicId | null;
  geometria_geojson: PublicLineString | null;
}

export interface PublicSchedule {
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  frecuencia: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

export interface PublicNextCollection {
  fecha: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  frecuencia: string;
  dias_restantes: number;
}

export interface PublicRouteStatus {
  disponible: boolean;
  codigo: string;
  mensaje: string;

  programacion: {
    fecha_programada: string;
    hora_inicio: string;
    hora_fin: string;
    turno: string;
  } | null;

  recorrido: {
    estado: string;
    fecha_hora_inicio: string;
    fecha_hora_finalizacion: string | null;
  } | null;
}

export interface PublicAvailableLocation {
  disponible: true;
  latitud: number;
  longitud: number;
  ultima_actualizacion: string;
  valida_hasta: string;
  estado_recorrido: string;
  es_aproximada: true;
  antiguedad_segundos: number;
}

export interface PublicUnavailableLocation {
  disponible: false;
  motivo: string;
  mensaje: string;
  ultima_actualizacion: string | null;
}

export type PublicLocation =
  | PublicAvailableLocation
  | PublicUnavailableLocation;

export interface PublicRouteInformation {
  ruta: PublicRoute;
  horarios: PublicSchedule[];

  proxima_recoleccion:
  PublicNextCollection | null;

  estado: PublicRouteStatus;
  ubicacion: PublicLocation;
}

interface PublicQrBase {
  codigo_qr: {
    titulo: string;
    descripcion: string | null;
    tipo_recurso: 'RUTA' | 'ZONA';
  };

  recurso: {
    tipo: 'RUTA' | 'ZONA';
    id: PublicId;
    nombre: string;
  };

  fecha_consulta: string;
  fecha_actualizacion: string;
}

export interface PublicQrZone extends PublicQrBase {
  tipo_recurso: 'ZONA';

  zona: {
    id_zona: PublicId;
    nombre: string;
  };

  rutas: PublicRouteInformation[];
}

export interface PublicQrRoute extends PublicQrBase {
  tipo_recurso: 'RUTA';

  cronograma: {
    fecha_consulta: string;
    tipo_recurso: 'RUTA';

    rutas: Array<
      Pick<
        PublicRouteInformation,
        'ruta' | 'horarios' | 'proxima_recoleccion'
      >
    >;
  };

  estado: PublicRouteStatus;
  ubicacion: PublicLocation;
}

export type PublicQrResponse =
  | {
    success: true;
    message: string;
    data: PublicQrZone | PublicQrRoute;
  }
  | {
    success: false;
    message: string;
    data: unknown;
  };

export interface PublicQrView {
  titulo: string;
  descripcion: string | null;
  sector: string;
  actualizado: string;
  rutas: PublicRouteInformation[];
}
