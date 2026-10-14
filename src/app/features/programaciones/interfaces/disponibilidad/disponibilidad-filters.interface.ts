// *********************************************************
// FILTROS PARA CONSULTAR DISPONIBILIDAD
// *********************************************************

export interface DisponibilidadFilters {
  /** Fecha local de la programación: YYYY-MM-DD. */
  fecha_programada?: string;

  /** Hora local de inicio: utiliza el formato aceptado por el backend. */
  hora_inicio_programada?: string;

  /** Hora local de fin: utiliza el formato aceptado por el backend. */
  hora_fin_programada?: string;

  /** Excluye esta programación de la consulta de conflictos. */
  exclude_programacion_id?: number;
}
