import { HttpResponse } from '@angular/common/http';

import {
  ReporteResumenFilters,
} from './reporte-resumen.interface';

import {
  ReporteProgramacionesFilters,
  ReporteProgramacionesColumnaKey,
} from './reporte-programaciones.interface';

import {
  ReporteRecorridosFilters,
  ReporteRecorridosColumnaKey,
} from './reporte-recorridos.interface';

import {
  ReporteRecoleccionesFilters,
  ReporteRecoleccionesColumnaKey,
} from './reporte-recolecciones.interface';

import {
  ReporteAtencionFilters,
  ReporteAtencionColumnaKey,
} from './reporte-atencion.interface';

import {
  ReporteIncidenciasFilters,
  ReporteIncidenciasColumnaKey,
} from './reporte-incidencias.interface';

import {
  ReporteVehiculosFilters,
  ReporteVehiculosColumnaKey,
} from './reporte-vehiculos.interface';

import {
  ReporteMantenimientosFilters,
  ReporteMantenimientosColumnaKey,
} from './reporte-mantenimientos.interface';

import {
  ReporteCiudadanosFilters,
  ReporteCiudadanosColumnaKey,
} from './reporte-ciudadanos.interface';

// *********************************************************
// 1. FORMATOS
// *********************************************************
export type ReporteFormatoExportacion =
  | 'csv'
  | 'xlsx'
  | 'pdf';

// *********************************************************
// 2. FILTROS PARA EXPORTACIÓN
// Se exportan todos los registros filtrados.
// *********************************************************
type FiltrosExportacion<T> =
  Omit<T, 'page' | 'limit'>;

// *********************************************************
// 3. COLUMNAS DEL RESUMEN EXPORTADO
// *********************************************************
export type ReporteResumenColumnaExportacion =
  | 'indicador'
  | 'valor'
  | 'unidad';

// *********************************************************
// 4. CONTRATO DE CADA REPORTE
// Relaciona tipo, filtros y columnas permitidas.
// *********************************************************
interface ReporteExportacionContratos {
  RESUMEN_OPERATIVO: {
    filtros: ReporteResumenFilters;
    columna: ReporteResumenColumnaExportacion;
  };

  PROGRAMACIONES: {
    filtros: FiltrosExportacion<ReporteProgramacionesFilters>;
    columna: ReporteProgramacionesColumnaKey;
  };

  RECORRIDOS: {
    filtros: FiltrosExportacion<ReporteRecorridosFilters>;
    columna: ReporteRecorridosColumnaKey;
  };

  RECOLECCIONES: {
    filtros: FiltrosExportacion<ReporteRecoleccionesFilters>;
    columna: ReporteRecoleccionesColumnaKey;
  };

  ATENCION_PUNTOS: {
    filtros: FiltrosExportacion<ReporteAtencionFilters>;
    columna: ReporteAtencionColumnaKey;
  };

  INCIDENCIAS: {
    filtros: FiltrosExportacion<ReporteIncidenciasFilters>;
    columna: ReporteIncidenciasColumnaKey;
  };

  VEHICULOS: {
    filtros: FiltrosExportacion<ReporteVehiculosFilters>;
    columna: ReporteVehiculosColumnaKey;
  };

  MANTENIMIENTOS: {
    filtros: FiltrosExportacion<ReporteMantenimientosFilters>;
    columna: ReporteMantenimientosColumnaKey;
  };

  REPORTES_CIUDADANOS: {
    filtros: FiltrosExportacion<ReporteCiudadanosFilters>;
    columna: ReporteCiudadanosColumnaKey;
  };
}

// *********************************************************
// 5. TIPOS EXPORTABLES
// *********************************************************
export type ReporteTipoExportable =
  keyof ReporteExportacionContratos;

// *********************************************************
// 6. REQUEST
// TypeScript valida las columnas según tipo_reporte.
// Omitir columnas o enviar null incluye todas.
// *********************************************************
export type ExportarReporteRequest = {
  [Tipo in ReporteTipoExportable]: {
    tipo_reporte: Tipo;

    formato: ReporteFormatoExportacion;

    filtros: ReporteExportacionContratos[Tipo]['filtros'];

    columnas?:
    ReporteExportacionContratos[Tipo]['columna'][]
    | null;
  };
}[ReporteTipoExportable];

// *********************************************************
// 7. RESPUESTA HTTP DEL ARCHIVO
// Incluye body Blob, headers y status.
// *********************************************************
export type ExportarReporteResponse = HttpResponse<Blob>;
