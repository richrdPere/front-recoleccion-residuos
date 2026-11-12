import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Service
import { AuthStorageService } from 'src/app/core/auth/auth-storage.service';

// Helper
import { HttpServiceHelper } from 'src/app/core/auth/http-service.helper';

// Interfaces
import { GetHistorialDetalleResponse, GetHistorialListadoFilters, GetHistorialListadoResponse, GetHistorialTrazadoResponse } from '../interfaces/historial';

@Injectable({
  providedIn: 'root',
})
export class HistorialService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'recorridos';

  private readonly API_GET_HISTORIAL_LISTADO: string = this.API_BASE + '/historial';
  private readonly API_GET_HISTORIAL_DETALLE: string = this.API_BASE + '/historial/';
  private readonly API_GET_HISTORIAL_TRAZADO: string = this.API_BASE + '/historial/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. OBTENER LISTADO DEL HISTORIAL
  // *********************************************************
  getHistorialListado(
    filters: GetHistorialListadoFilters,
  ): Observable<GetHistorialListadoResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    const params = HttpServiceHelper.buildParams(
      filters,
    );

    return this.http
      .get<GetHistorialListadoResponse>(
        this.API_GET_HISTORIAL_LISTADO,
        { params, headers },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el listado de recorridos.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER DETALLE DEL HISTORIAL
  // *********************************************************
  getHistorialDetalle(
    idRecorrido: number,
  ): Observable<GetHistorialDetalleResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetHistorialDetalleResponse>(
        `${this.API_GET_HISTORIAL_DETALLE}${idRecorrido}`,
        { headers },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el detalle del historial.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER DETALLE DEL HISTORIAL
  // *********************************************************
  getHistorialTrazado(
    idRecorrido: number,
  ): Observable<GetHistorialTrazadoResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetHistorialTrazadoResponse>(
        `${this.API_GET_HISTORIAL_TRAZADO}${idRecorrido}/trazado`,
        { headers },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el trazado GPS del recorrido.',
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
