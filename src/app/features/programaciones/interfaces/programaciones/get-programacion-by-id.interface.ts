// Ajusta las rutas según la ubicación de tus interfaces.
import { ApiResponse } from 'src/app/core/models/api-response.model';
import type {
  CreateProgramacionData,
  CreateProgramacionHistorial,
  CreateProgramacionEquipoItem,
} from './create-programacion.interface';
import { EstadoProgramacion } from './get-programaciones-paginated.interface';


// *********************************************************
// DETALLE DE PROGRAMACIÓN
// *********************************************************
export interface ProgramacionDetalleData
  extends Omit<
    CreateProgramacionData,
    'estado_programacion' | 'historial'
  > {
  estado_programacion: EstadoProgramacion;
  historial: ProgramacionDetalleHistorial[];
}

// *********************************************************
// HISTORIAL
// *********************************************************
export interface ProgramacionDetalleHistorial
  extends Omit<
    CreateProgramacionHistorial,
    | 'estado_anterior'
    | 'estado_nuevo'
    | 'datos_anteriores'
    | 'datos_nuevos'
  > {
  estado_anterior: EstadoProgramacion | null;
  estado_nuevo: EstadoProgramacion | null;

  datos_anteriores: ProgramacionHistorialDatos | null;
  datos_nuevos: ProgramacionHistorialDatos | null;
}

// *********************************************************
// DATOS REGISTRADOS EN EL HISTORIAL
// *********************************************************
export interface ProgramacionHistorialDatos {
  equipo?: CreateProgramacionEquipoItem[];

  id_ruta?: number;
  id_vehiculo?: number;
  id_ruta_version?: number;

  fecha_programada?: string;
  hora_inicio_programada?: string;
  hora_fin_programada?: string;

  // Otros campos pueden variar según el evento registrado.
  [campo: string]: unknown;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export type GetProgramacionByIdResponse = ApiResponse<ProgramacionDetalleData>;
