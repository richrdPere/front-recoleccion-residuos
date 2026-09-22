import { CronogramaDiaSemana, CronogramaFrecuencia } from "src/app/features/ciudadanos/interfaces";

// *********************************************************
// QUERY PARAMS
// *********************************************************
export interface GetInformacionPublicaQrParams {
  // Formato YYYY-MM-DD.
  fecha_referencia?: string | null;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetInformacionPublicaQrResponse =
  | {
    success: true;
    message: string;
    data: InformacionPublicaQrZona | InformacionPublicaQrRuta;
  }
  | {
    success: false;
    message: string;
    data: InformacionPublicaQrNoDisponible;
  };

// *********************************************************
// INFORMACIÓN DE ZONA
// *********************************************************
export interface InformacionPublicaQrZona {
  codigo_qr: {
    titulo: string;
    descripcion: string | null;
    tipo_recurso: 'ZONA';
  };

  tipo_recurso: 'ZONA';

  recurso: {
    tipo: 'ZONA';
    id: number;
    nombre: string;
  };

  fecha_consulta: string;
  zona: QrPublicoZonaResumen;
  rutas: QrPublicoRutaInformacion[];
}

// *********************************************************
// INFORMACIÓN DE RUTA
// Estructura según el service backend compartido.
// *********************************************************
export interface InformacionPublicaQrRuta {
  codigo_qr: {
    titulo: string;
    descripcion: string | null;
    tipo_recurso: 'RUTA';
  };

  tipo_recurso: 'RUTA';

  recurso: {
    tipo: 'RUTA';
    id: number;
    nombre: string;
  };

  fecha_consulta: string;

  cronograma: {
    fecha_consulta: string;
    tipo_recurso: 'RUTA';
    rutas: QrPublicoRutaCronograma[];
  };

  estado: QrPublicoEstadoRuta;
  ubicacion: QrPublicoUbicacion;
}

// *********************************************************
// QR NO DISPONIBLE
// *********************************************************
export interface InformacionPublicaQrNoDisponible {
  codigo_qr: {
    encontrado: boolean;
    disponible: boolean;
    estado?: string;
    mensaje?: string;
  };

  cronograma: null;
  rutas: [];
}

// *********************************************************
// RESÚMENES
// *********************************************************
export interface QrPublicoZonaResumen {
  id_zona: number;
  nombre: string;
}

export interface QrPublicoRutaResumen {
  id_ruta: number;
  nombre: string;
}

// *********************************************************
// CRONOGRAMA E INFORMACIÓN POR RUTA
// *********************************************************
export interface QrPublicoRutaCronograma {
  ruta: QrPublicoRutaResumen;
  horarios: QrPublicoHorario[];
  proxima_recoleccion: QrPublicoProximaRecoleccion | null;
}

export interface QrPublicoRutaInformacion
  extends QrPublicoRutaCronograma {
  estado: QrPublicoEstadoRuta;
  ubicacion: QrPublicoUbicacion;
}

export interface QrPublicoHorario {
  dia_semana: CronogramaDiaSemana;
  hora_inicio: string;
  hora_fin: string;
  frecuencia: CronogramaFrecuencia;
  fecha_inicio: string;
  fecha_fin: string | null;
}

export interface QrPublicoProximaRecoleccion {
  fecha: string;
  dia_semana: CronogramaDiaSemana;
  hora_inicio: string;
  hora_fin: string;
  frecuencia: CronogramaFrecuencia;
  dias_restantes: number;
}

// *********************************************************
// ESTADO OPERATIVO
// *********************************************************
export interface QrPublicoEstadoRuta {
  disponible: boolean;
  codigo: string;
  mensaje: string;

  // Pendiente de tipar cuando estas asociaciones tengan datos.
  programacion: Record<string, unknown> | null;
  recorrido: Record<string, unknown> | null;
}

// *********************************************************
// UBICACIÓN
// *********************************************************
export type QrPublicoUbicacion =
  | {
    disponible: false;
    motivo: string;
    mensaje: string;
    ultima_actualizacion?: string | null;
  }
  | {
    disponible: true;

    // Falta confirmar el JSON de ubicación disponible.
    [campo: string]: unknown;
  };
