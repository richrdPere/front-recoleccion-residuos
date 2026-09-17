// *********************************************************
// REQUEST PARA CREAR HORARIO

import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
export interface CreateRutaHorarioRequest {
  dia_semana: string;

  // Formato: HH:mm:ss.
  hora_inicio: string;
  hora_fin: string;

  frecuencia: string;

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
