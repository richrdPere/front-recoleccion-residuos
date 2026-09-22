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
import { GetRecorridoPosicionesParams, GetRecorridoPosicionesResponse, GetUltimaUbicacionResponse, GetVehiculosActivosResponse } from '../interfaces/ubicaciones-tracking';

@Injectable({
  providedIn: 'root'
})
export class UbicacionesTrackingService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'tracking';

  private readonly API_GET_VEHICULOS_ACTIVOS: string = this.API_BASE + '/vehiculos-activos';
  private readonly API_LAST_UBICACION_BY_RECORRIDO_ID: string = this.API_BASE + '/recorridos/';
  private readonly API_GET_POSICIONES_BY_RECORRIDO_ID: string = this.API_BASE + '/recorridos/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. OBTENER VEHÍCULOS ACTIVOS
  // *********************************************************
  getVehiculosActivos(): Observable<GetVehiculosActivosResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetVehiculosActivosResponse>(
        `${this.API_GET_VEHICULOS_ACTIVOS}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los vehículos activos.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER ÚLTIMA UBICACIÓN DEL RECORRIDO
  // *********************************************************
  getUltimaUbicacionRecorrido(
    idRecorrido: number,
  ): Observable<GetUltimaUbicacionResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetUltimaUbicacionResponse>(
        `${this.API_LAST_UBICACION_BY_RECORRIDO_ID}${idRecorrido}/ultima-ubicacion`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la última ubicación del recorrido.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER POSICIONES DEL RECORRIDO
  // *********************************************************
  getRecorridoPosiciones(
    idRecorrido: number,
    query: GetRecorridoPosicionesParams = {},
  ): Observable<GetRecorridoPosicionesResponse> {
    const params = HttpServiceHelper.buildParams(query);
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetRecorridoPosicionesResponse>(
        `${this.API_GET_POSICIONES_BY_RECORRIDO_ID}${idRecorrido}/posiciones`,
        {
          headers,
          params,
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las posiciones del recorrido.',
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
