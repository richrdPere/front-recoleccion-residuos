// *********************************************************
// 1. FILTROS
// *********************************************************
export interface DashboardResumenFilters {
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  id_zona?: number | null;
  id_ruta?: number | null;
  id_vehiculo?: number | null;

  // Valor confirmado: 'DIA'.
  // Mantener string hasta confirmar los demás valores
  // permitidos por las validaciones del backend.
  agrupacion?: string | null;
}

// *********************************************************
// 2. DICCIONARIOS
// *********************************************************
export interface DashboardConteosPorEstado {
  [estado: string]: number | undefined;
}

export interface DashboardCantidadesPorUnidad {
  [unidad: string]: number | undefined;
}

// *********************************************************
// 3. PERÍODO
// *********************************************************
export interface DashboardPeriodo {
  fecha_inicio: string;
  fecha_fin: string;
  dias_periodo: number;
}

// *********************************************************
// 4. RESUMEN DE PROGRAMACIONES
// *********************************************************
export interface DashboardProgramacionesResumen {
  total: number;
  por_estado: DashboardConteosPorEstado;
  ejecutables: number;
  iniciadas: number;
  no_iniciadas: number;
  finalizadas: number;
  canceladas: number;
  cumplimiento_porcentaje: number;
  tasa_inicio_porcentaje: number;
  duracion_promedio_minutos: number;
  distancia_total_km: number;
}

// *********************************************************
// 5. RESUMEN DE RECORRIDOS
// *********************************************************
export interface DashboardRecorridosResumen {
  activos: number;
  iniciados: number;
  finalizados: number;
  distancia_total_km: number;
  duracion_promedio_minutos: number;
}

// *********************************************************
// 6. RESUMEN DE RECOLECCIONES
// *********************************************************
export interface DashboardRecoleccionesResumen {
  puntos_programados: number;
  puntos_atendidos: number;
  puntos_pendientes: number;
  avance_porcentaje: number;
  registros_validos: number;
  registros_anulados: number;
  registros_con_evidencia: number;
  registros_sin_evidencia: number;
  cantidades_por_unidad: DashboardCantidadesPorUnidad;
}

// *********************************************************
// 7. RESUMEN DE VEHÍCULOS
// *********************************************************
export interface DashboardVehiculosResumen {
  total: number;
  por_estado: DashboardConteosPorEstado;
  operativos: number;
  en_recorrido: number;
  disponibles: number;
  fuera_servicio: number;
  cerca_capacidad: number;
  capacidad_completa: number;
}

// *********************************************************
// 8. RESUMEN DE INCIDENCIAS
// *********************************************************
export interface DashboardIncidenciasResumen {
  disponible: boolean;
  total: number;
  abiertas: number;
  criticas: number;
}

// *********************************************************
// 9. TENDENCIAS
// *********************************************************
export interface DashboardTendencia {
  periodo: string;
  programaciones: number;
  iniciadas: number;
  finalizadas: number;
  canceladas: number;
  puntos_programados: number;
  puntos_atendidos: number;
  cantidades_por_unidad: DashboardCantidadesPorUnidad;
  cumplimiento_porcentaje: number;
  avance_recoleccion_porcentaje: number;
}

// *********************************************************
// 10. GEOMETRÍA DE ZONA
// *********************************************************
export interface DashboardPoligonoGeoJSON {
  type: 'Polygon';
  coordinates: number[][][];
}

// *********************************************************
// 11. ZONA DEL RENDIMIENTO DE RUTA
// *********************************************************
export interface DashboardRutaZona {
  id_zona: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  poligono_geojson: DashboardPoligonoGeoJSON;
  centro_latitud: string;
  centro_longitud: string;
  estado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// *********************************************************
// 12. RENDIMIENTO POR RUTA
// *********************************************************
export interface DashboardRendimientoRuta {
  id_ruta: number;
  ruta: string;
  zona: DashboardRutaZona;
  programaciones: number;
  finalizadas: number;
  canceladas: number;
  cumplimiento_porcentaje: number;
  puntos_programados: number;
  puntos_atendidos: number;
  avance_porcentaje: number;
  duracion_promedio_minutos: number;
  distancia_promedio_km: number;
  cantidades_por_unidad: DashboardCantidadesPorUnidad;
}

// *********************************************************
// 13. DATOS DEL RESUMEN GENERAL
// *********************************************************
export interface DashboardResumenData {
  periodo: DashboardPeriodo;
  generado_en: string;
  programaciones: DashboardProgramacionesResumen;
  recorridos: DashboardRecorridosResumen;
  recolecciones: DashboardRecoleccionesResumen;
  vehiculos: DashboardVehiculosResumen;
  incidencias: DashboardIncidenciasResumen;
  tendencias: DashboardTendencia[];
  rendimiento_rutas: DashboardRendimientoRuta[];
}

// *********************************************************
// 14. RESPUESTA DEL ENDPOINT
// *********************************************************
export interface GetDashboardResumenResponse {
  success: boolean;
  message: string;
  data: DashboardResumenData;
}
