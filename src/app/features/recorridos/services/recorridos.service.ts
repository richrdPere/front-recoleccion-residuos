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
import { CancelarRecorridoRequest, CancelarRecorridoResponse, GetRecorridoActivoResponse, GetRecorridoByIdResponse, GetRecorridoEventosParams, GetRecorridoEventosResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class RecorridosService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'recorridos';

  private readonly API_CANCELAR_RECORRIDO: string = this.API_BASE + '/cancelar/';
  private readonly API_GET_RECORRIDO_ACTIVO: string = this.API_BASE + '/activo';
  private readonly API_GET_RECORRIDO_DETALLE: string = this.API_BASE + '/view/';
  private readonly API_GET_EVENTOS_POR_RECORRIDO: string = this.API_BASE + '/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. CANCELAR RECORRIDO
  // *********************************************************
  cancelarRecorrido(
    idRecorrido: number,
    request: CancelarRecorridoRequest,
  ): Observable<CancelarRecorridoResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .patch<CancelarRecorridoResponse>(
        `${this.API_CANCELAR_RECORRIDO}${idRecorrido}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cancelar el recorrido.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER RECORRIDO ACTIVO
  // *********************************************************
  getRecorridoActivo(): Observable<GetRecorridoActivoResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetRecorridoActivoResponse>(
        this.API_GET_RECORRIDO_ACTIVO,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el recorrido activo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER RECORRIDO POR ID
  // *********************************************************
  getRecorridoById(
    idRecorrido: number,
  ): Observable<GetRecorridoByIdResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetRecorridoByIdResponse>(
        `${this.API_GET_RECORRIDO_DETALLE}${idRecorrido}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el detalle del recorrido.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER EVENTOS DEL RECORRIDO
  // *********************************************************
  getRecorridoEventos(
    idRecorrido: number,
    query: GetRecorridoEventosParams = {},
  ): Observable<GetRecorridoEventosResponse> {
    const params = HttpServiceHelper.buildParams(query);
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetRecorridoEventosResponse>(
        `${this.API_GET_EVENTOS_POR_RECORRIDO}${idRecorrido}/eventos`,
        { headers, params },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los eventos del recorrido.',
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
