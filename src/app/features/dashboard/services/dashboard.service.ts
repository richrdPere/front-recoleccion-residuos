import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Service
import { AuthStorageService } from 'src/app/core/auth/auth-storage.service';

// Helper
import { HttpServiceHelper } from 'src/app/core/auth/http-service.helper';

// Interface
import { DashboardProgramacionesFilters, DashboardRecoleccionesFilters, DashboardRendimientoRutasFilters, DashboardResumenFilters, DashboardTendenciasFilters, DashboardVehiculosFilters, GetDashboardProgramacionesResponse, GetDashboardRecoleccionesResponse, GetDashboardRendimientoRutasResponse, GetDashboardResumenResponse, GetDashboardTendenciasResponse, GetDashboardVehiculosResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'dashboard';

  private readonly API_GET_DASHBOARD_RESUMEN: string = this.API_BASE + '/resumen';
  private readonly API_GET_DASHBOARD_PROGRAMACIONES: string = this.API_BASE + '/programaciones';
  private readonly API_GET_DASHBOARD_RECOLECCIONES: string = this.API_BASE + '/recolecciones';
  private readonly API_GET_DASHBOARD_VEHICULOS: string = this.API_BASE + '/vehiculos';
  private readonly API_GET_DASHBOARD_RENDIMIENTO_RUTAS: string = this.API_BASE + '/rendimiento-rutas';
  private readonly API_GET_DASHBOARD_TENDENCIAS: string = this.API_BASE + '/tendencias';


  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. OBTENER RESUMEN GENERAL
  // *********************************************************
  getDashboardResumen(
    filters: DashboardResumenFilters = {},
  ): Observable<GetDashboardResumenResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetDashboardResumenResponse>(
        this.API_GET_DASHBOARD_RESUMEN,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el resumen del dashboard.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER INDICADORES DE PROGRAMACIONES
  // *********************************************************
  getDashboardProgramaciones(
    filters: DashboardProgramacionesFilters = {},
  ): Observable<GetDashboardProgramacionesResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetDashboardProgramacionesResponse>(
        this.API_GET_DASHBOARD_PROGRAMACIONES,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los indicadores de programaciones.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER INDICADORES DE RECOLECCIONES
  // *********************************************************
  getDashboardRecolecciones(
    filters: DashboardRecoleccionesFilters = {},
  ): Observable<GetDashboardRecoleccionesResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetDashboardRecoleccionesResponse>(
        this.API_GET_DASHBOARD_RECOLECCIONES,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los indicadores de recolecciones.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER INDICADORES DE VEHÍCULOS
  // *********************************************************
  getDashboardVehiculos(
    filters: DashboardVehiculosFilters = {},
  ): Observable<GetDashboardVehiculosResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetDashboardVehiculosResponse>(
        this.API_GET_DASHBOARD_VEHICULOS,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los indicadores de vehículos.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. OBTENER RENDIMIENTO DE RUTAS
  // *********************************************************
  getDashboardRendimientoRutas(
    filters: DashboardRendimientoRutasFilters = {},
  ): Observable<GetDashboardRendimientoRutasResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetDashboardRendimientoRutasResponse>(
        this.API_GET_DASHBOARD_RENDIMIENTO_RUTAS,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el rendimiento de las rutas.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. OBTENER TENDENCIAS DEL DASHBOARD
  // *********************************************************
  getDashboardTendencias(
    filters: DashboardTendenciasFilters = {},
  ): Observable<GetDashboardTendenciasResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetDashboardTendenciasResponse>(
        this.API_GET_DASHBOARD_TENDENCIAS,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las tendencias del dashboard.',
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
}
