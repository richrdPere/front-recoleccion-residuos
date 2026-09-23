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
import { GetMonitoreoAlertasResponse, GetMonitoreoMapaResponse, GetMonitoreoOperacionResponse, GetMonitoreoRecorridoDetalleResponse, MonitoreoAlertasFilters, MonitoreoMapaFilters, MonitoreoOperacionFilters } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class MonitoreoService {


  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'monitoreo';

  private readonly API_GET_MONITOREO_OPERACION: string = this.API_BASE + '/operacion';
  private readonly API_GET_MONITOREO_MAPA: string = this.API_BASE + '/mapa';
  private readonly API_GET_MONITOREO_ALERTAS: string = this.API_BASE + '/alertas';
  private readonly API_GET_MONITOREO_RECORRIDO_DETALLE: string = this.API_BASE + '/recorridos/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }


  // *********************************************************
  // 1. OBTENER MONITOREO OPERATIVO
  // *********************************************************
  getMonitoreoOperacion(
    filters: MonitoreoOperacionFilters = {},
  ): Observable<GetMonitoreoOperacionResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetMonitoreoOperacionResponse>(
        this.API_GET_MONITOREO_OPERACION,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el monitoreo operativo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER RECORRIDOS ACTIVOS DEL MAPA
  // *********************************************************
  getMonitoreoMapa(
    filters: MonitoreoMapaFilters = {},
  ): Observable<GetMonitoreoMapaResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetMonitoreoMapaResponse>(
        this.API_GET_MONITOREO_MAPA,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los recorridos activos del mapa.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER DETALLE DEL RECORRIDO EN MONITOREO
  // *********************************************************
  getMonitoreoRecorridoDetalle(
    idRecorrido: number,
  ): Observable<GetMonitoreoRecorridoDetalleResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetMonitoreoRecorridoDetalleResponse>(
        `${this.API_GET_MONITOREO_RECORRIDO_DETALLE}${idRecorrido}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el detalle del recorrido en monitoreo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER ALERTAS OPERATIVAS
  // *********************************************************
  getMonitoreoAlertas(
    filters: MonitoreoAlertasFilters = {},
  ): Observable<GetMonitoreoAlertasResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetMonitoreoAlertasResponse>(
        this.API_GET_MONITOREO_ALERTAS,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las alertas operativas.',
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
