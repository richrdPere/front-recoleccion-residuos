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
import { ArchivarNotificacionResponse, EnviarNotificacionRequest, EnviarNotificacionResponse, GetMisNotificacionesParams, GetMisNotificacionesResponse, GetNotificacionByIdResponse, GetTotalNoLeidasResponse, MarcarNotificacionLeidaResponse, MarcarTodasNotificacionesLeidasResponse } from '../interfaces/notificaciones';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'notificaciones';

  private readonly API_SEND_NOTIFICATION: string = this.API_BASE + '/enviar';

  // Bandeja personal
  private readonly API_GET_MIS_NOTIFICACIONES: string = this.API_BASE + '/mis-notificaciones';
  private readonly API_GET_NO_LEIDAS_TOTAL: string = this.API_BASE + '/no-leidas/total';
  private readonly API_MARK_NOTIFICATION_NO_LEIDAS: string = this.API_BASE + '/leer-todas';

  // Operaciones individuales
  private readonly API_GET_NOTIFICACION_BY_ID: string = this.API_BASE + '/';
  private readonly API_READ_NOTIFICATION: string = this.API_BASE + '/';
  private readonly API_ARCHIVED_NOTIFICATION: string = this.API_BASE + '/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }


  // *********************************************************
  // 1. ENVIAR NOTIFICACIÓN
  // *********************************************************
  enviarNotificacion(
    request: EnviarNotificacionRequest,
  ): Observable<EnviarNotificacionResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .post<EnviarNotificacionResponse>(
        `${this.API_SEND_NOTIFICATION}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo enviar la notificación.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER MIS NOTIFICACIONES
  // *********************************************************
  getMisNotificaciones(
    query: GetMisNotificacionesParams = {},
  ): Observable<GetMisNotificacionesResponse> {
    const params = HttpServiceHelper.buildParams(query);
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetMisNotificacionesResponse>(
        this.API_GET_MIS_NOTIFICACIONES,
        {
          headers,
          params,
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener tus notificaciones.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER TOTAL DE NOTIFICACIONES NO LEÍDAS
  // *********************************************************
  getTotalNoLeidas(): Observable<GetTotalNoLeidasResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetTotalNoLeidasResponse>(
        this.API_GET_NO_LEIDAS_TOTAL,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el total de notificaciones no leídas.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER NOTIFICACIÓN POR ID
  // *********************************************************
  getNotificacionById(
    id: number,
  ): Observable<GetNotificacionByIdResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetNotificacionByIdResponse>(
        `${this.API_GET_NOTIFICACION_BY_ID}${id}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la notificación.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. MARCAR NOTIFICACIÓN COMO LEÍDA
  // *********************************************************
  marcarNotificacionLeida(
    id: number,
  ): Observable<MarcarNotificacionLeidaResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .patch<MarcarNotificacionLeidaResponse>(
        `${this.API_READ_NOTIFICATION}${id}/leer`,
        {},
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo marcar la notificación como leída.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. MARCAR TODAS LAS NOTIFICACIONES COMO LEÍDAS
  // *********************************************************
  marcarTodasNotificacionesLeidas():
    Observable<MarcarTodasNotificacionesLeidasResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .patch<MarcarTodasNotificacionesLeidasResponse>(
        this.API_MARK_NOTIFICATION_NO_LEIDAS,
        {},
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron marcar todas las notificaciones como leídas.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. ARCHIVAR NOTIFICACIÓN
  // *********************************************************
  archivarNotificacion(id: number): Observable<ArchivarNotificacionResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .patch<ArchivarNotificacionResponse>(
        `${this.API_ARCHIVED_NOTIFICATION}${id}/archivar`,
        {},
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo archivar la notificación.',
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
