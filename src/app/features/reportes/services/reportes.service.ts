import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, from, Observable, switchMap } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Service
import { AuthStorageService } from 'src/app/core/auth/auth-storage.service';

// Helper
import { HttpServiceHelper } from 'src/app/core/auth/http-service.helper';

// Interfaces
import { ExportarReporteRequest, ExportarReporteResponse, GetReporteAtencionResponse, GetReporteCiudadanosResponse, GetReporteIncidenciasResponse, GetReporteMantenimientosResponse, GetReporteProgramacionesResponse, GetReporteRecoleccionesResponse, GetReporteRecorridosResponse, GetReporteResumenResponse, GetReporteVehiculosResponse, ReporteAtencionFilters, ReporteCiudadanosFilters, ReporteIncidenciasFilters, ReporteMantenimientosFilters, ReporteProgramacionesFilters, ReporteRecoleccionesFilters, ReporteRecorridosFilters, ReporteResumenFilters, ReporteVehiculosFilters } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ReportesServices {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'reportes';

  private readonly API_GET_REPORTE_RESUMEN: string = this.API_BASE + '/resumen';
  private readonly API_GET_REPORTE_PROGRAMACIONES: string = this.API_BASE + '/programaciones';
  private readonly API_GET_REPORTE_RECORRIDOS: string = this.API_BASE + '/recorridos';
  private readonly API_GET_REPORTE_RECOLECCIONES: string = this.API_BASE + '/recolecciones';
  private readonly API_GET_REPORTE_ATENCION: string = this.API_BASE + '/atencion-puntos';
  private readonly API_GET_REPORTE_INCIDENCIAS: string = this.API_BASE + '/incidencias';
  private readonly API_GET_REPORTE_VEHICULOS: string = this.API_BASE + '/vehiculos';
  private readonly API_GET_REPORTE_MANTENIMIENTOS: string = this.API_BASE + '/mantenimientos';
  private readonly API_GET_REPORTE_CIUDADANOS: string = this.API_BASE + '/ciudadanos';
  private readonly API_EXPORTAR_REPORTE: string = this.API_BASE + '/exportar';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. OBTENER RESUMEN OPERATIVO
  // *********************************************************
  getReporteResumen(
    filters: ReporteResumenFilters,
  ): Observable<GetReporteResumenResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetReporteResumenResponse>(
        this.API_GET_REPORTE_RESUMEN,
        {
          params,
          headers,
        },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el resumen operativo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER REPORTE DE PROGRAMACIONES
  // *********************************************************
  getReporteProgramaciones(
    filters: ReporteProgramacionesFilters,
  ): Observable<GetReporteProgramacionesResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetReporteProgramacionesResponse>(
        this.API_GET_REPORTE_PROGRAMACIONES,
        {
          params,
          headers,
        },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el reporte de programaciones.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER REPORTE DE RECORRIDOS
  // *********************************************************
  getReporteRecorridos(
    filters: ReporteRecorridosFilters,
  ): Observable<GetReporteRecorridosResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetReporteRecorridosResponse>(
        this.API_GET_REPORTE_RECORRIDOS,
        {
          params,
          headers,
        },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el reporte de recorridos.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER REPORTE DE RESIDUOS RECOLECTADOS
  // *********************************************************
  getReporteRecolecciones(
    filters: ReporteRecoleccionesFilters,
  ): Observable<GetReporteRecoleccionesResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetReporteRecoleccionesResponse>(
        this.API_GET_REPORTE_RECOLECCIONES,
        {
          params,
          headers,
        },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el reporte de residuos recolectados.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. OBTENER REPORTE DE ATENCIÓN DE PUNTOS
  // *********************************************************
  getReporteAtencion(
    filters: ReporteAtencionFilters,
  ): Observable<GetReporteAtencionResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetReporteAtencionResponse>(
        this.API_GET_REPORTE_ATENCION,
        {
          params,
          headers,
        },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el reporte de atención de puntos.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. OBTENER REPORTE DE INCIDENCIAS
  // *********************************************************
  getReporteIncidencias(
    filters: ReporteIncidenciasFilters,
  ): Observable<GetReporteIncidenciasResponse> {
    const params =
      HttpServiceHelper.buildParams(filters);

    const headers = this.getJsonHeaders();

    return this.http
      .get<GetReporteIncidenciasResponse>(
        this.API_GET_REPORTE_INCIDENCIAS,
        {
          params,
          headers,
        },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el reporte de incidencias.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. OBTENER REPORTE DE VEHÍCULOS
  // *********************************************************
  getReporteVehiculos(
    filters: ReporteVehiculosFilters,
  ): Observable<GetReporteVehiculosResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetReporteVehiculosResponse>(
        this.API_GET_REPORTE_VEHICULOS,
        {
          params,
          headers,
        },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el reporte de vehículos.',
          ),
        ),
      );
  }

  // *********************************************************
  // 8. OBTENER REPORTE DE MANTENIMIENTOS
  // *********************************************************
  getReporteMantenimientos(
    filters: ReporteMantenimientosFilters,
  ): Observable<GetReporteMantenimientosResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetReporteMantenimientosResponse>(
        this.API_GET_REPORTE_MANTENIMIENTOS,
        {
          params,
          headers,
        },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el reporte de mantenimientos.',
          ),
        ),
      );
  }

  // *********************************************************
  // 9. OBTENER REPORTE DE INCIDENCIAS CIUDADANAS
  // *********************************************************
  getReporteCiudadanos(
    filters: ReporteCiudadanosFilters,
  ): Observable<GetReporteCiudadanosResponse> {
    const params =
      HttpServiceHelper.buildParams(filters);

    const headers = this.getJsonHeaders();

    return this.http
      .get<GetReporteCiudadanosResponse>(
        this.API_GET_REPORTE_CIUDADANOS,
        {
          params,
          headers,
        },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el reporte de incidencias ciudadanas.',
          ),
        ),
      );
  }

  // *********************************************************
  // 10. EXPORTAR REPORTE
  // *********************************************************
  exportarReporte(
    request: ExportarReporteRequest,
  ): Observable<ExportarReporteResponse> {
    const tiposContenido = {
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.' + 'spreadsheetml.sheet',
      pdf: 'application/pdf',
    };

    const headers = this.getJsonHeaders().set(
      'Accept',
      `${tiposContenido[request.formato]}, application/json`,
    );

    // Los formularios pueden contener filtros opcionales vacíos.
    // El backend espera que esos filtros se omitan.
    const filtros = Object.fromEntries(
      Object.entries(request.filtros).filter(
        ([, valor]) =>
          valor !== null &&
          valor !== undefined &&
          valor !== '',
      ),
    );

    const body = {
      ...request,
      filtros,
    };

    return this.http
      .post(
        this.API_EXPORTAR_REPORTE,
        body,
        {
          headers,
          observe: 'response',
          responseType: 'blob',
        },
      )
      .pipe(
        catchError((error: unknown) =>
          from(
            this.normalizarErrorExportacion(error),
          ).pipe(
            switchMap((errorNormalizado: unknown) =>
              HttpServiceHelper.handleError(
                errorNormalizado,
                'No se pudo exportar el reporte.',
              ),
            ),
          ),
        ),
      );
  }

  // *********************************************************
  // MÉTODOS PRIVADOS
  // *********************************************************
  private getJsonHeaders(): HttpHeaders {
    return HttpServiceHelper.getHeaders({
      token:
        this.authStorage.getAccessToken(),
    });
  }

  // *********************************************************
  // NORMALIZAR ERROR JSON RECIBIDO COMO BLOB
  // *********************************************************
  private async normalizarErrorExportacion(
    error: unknown,
  ): Promise<unknown> {
    if (
      !(error instanceof HttpErrorResponse) ||
      typeof Blob === 'undefined' ||
      !(error.error instanceof Blob)
    ) {
      return error;
    }

    try {
      const contenido = await error.error.text();

      const body: unknown = JSON.parse(contenido);

      if (
        body === null ||
        typeof body !== 'object' ||
        Array.isArray(body)
      ) {
        return error;
      }

      return new HttpErrorResponse({
        error: body,
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url ?? undefined,
      });
    } catch {
      return error;
    }
  }
}
