// *********************************************************
// QUERY PARAMS
// *********************************************************
export interface GetDomicilioCronogramaParams {
  // Formato YYYY-MM-DD.
  fecha_referencia?: string | null;
}

// *********************************************************
// TIPOS
// *********************************************************
export type CronogramaDiaSemana =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SABADO'
  | 'DOMINGO';

export type CronogramaFrecuencia =
  | 'SEMANAL'
  | 'QUINCENAL'
  | 'MENSUAL'
  | 'ESPECIAL';

// *********************************************************
// RESPONSE
// *********************************************************
export interface GetDomicilioCronogramaResponse {
  success: boolean;
  message: string;
  data: DomicilioCronogramaData;
}

export interface DomicilioCronogramaData {
  fecha_consulta: string;
  domicilio: CronogramaDomicilio;
  horarios: CronogramaHorario[];
  proxima_recoleccion: CronogramaProximaRecoleccion;
}

// *********************************************************
// DOMICILIO
// *********************************************************
export interface CronogramaDomicilio {
  id_domicilio: number;
  nombre_domicilio: string;
  direccion: string;
  referencia: string | null;

  latitud: string;
  longitud: string;
  es_principal: boolean;

  zona: CronogramaZona | null;
  ruta: CronogramaRuta;
}

export interface CronogramaZona {
  id_zona: number;
  nombre: string;
}

export interface CronogramaRuta {
  id_ruta: number;
  nombre: string;
}

// *********************************************************
// HORARIO DE RUTA
// *********************************************************
export interface CronogramaHorario {
  id_ruta_horario: number;
  id_ruta: number;

  dia_semana: CronogramaDiaSemana;
  hora_inicio: string;
  hora_fin: string;
  frecuencia: CronogramaFrecuencia;

  fecha_vigencia_desde: string;
  fecha_vigencia_hasta: string | null;

  observacion: string | null;
  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// PRÓXIMA RECOLECCIÓN
// *********************************************************
export interface CronogramaProximaRecoleccion {
  fecha: string;
  dia_semana: CronogramaDiaSemana;
  hora_inicio: string;
  hora_fin: string;
  frecuencia: CronogramaFrecuencia;
  id_horario: number;
}
