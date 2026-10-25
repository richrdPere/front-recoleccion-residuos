import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// REQUEST PARA CREAR HORARIO
// *********************************************************

export type DiasSemana =
  | 'DOMINGO'
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SABADO';

export type Frecuencia =
  | 'SEMANAL'
  | 'QUINCENAL'
  | 'MENSUAL'
  | 'ESPECIAL';


export interface CreateRutaHorarioRequest {
  dia_semana: DiasSemana;

  // Formato: HH:mm:ss.
  hora_inicio: string;
  hora_fin: string;

  frecuencia: Frecuencia;

  // Formato: YYYY-MM-DD.
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta: string | null;

  observacion: string | null;
}

// *********************************************************
// HORARIO CREADO
// *********************************************************
export interface CreateRutaHorarioData {
  id_ruta_horario: number;
  id_ruta: number;

  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  frecuencia: string;

  fecha_vigencia_desde: string;
  fecha_vigencia_hasta: string | null;

  observacion: string | null;
  estado: boolean;

  created_at: string;
  updated_at: string;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type CreateRutaHorarioResponse = ApiResponse<CreateRutaHorarioData>;
