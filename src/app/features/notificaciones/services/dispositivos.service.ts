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
import { DesactivarDispositivoRequest, DesactivarDispositivoResponse, DesactivarDispositivoTokenRequest, DesactivarDispositivoTokenResponse, GetMisDispositivosResponse, RegistrarDispositivoRequest, RegistrarDispositivoResponse } from '../interfaces/dispositivos';

@Injectable({
  providedIn: 'root'
})
export class DispositivoService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'notificaciones/dispositivos';

  private readonly API_REGISTER_DISPOSITIVO: string = this.API_BASE + '/register';
  private readonly API_GET_MIS_DISPOSITIVOS: string = this.API_BASE + '/mis-dispositivos';
  private readonly API_DESACTIVATED_DISPOSITIVO_BY_TOKEN: string = this.API_BASE + '/token/desactivar';
  private readonly API_DESACTIVATED_DISPOSITIVO_BY_ID: string = this.API_BASE + '/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }


  // *********************************************************
  // 1. REGISTRAR DISPOSITIVO
  // *********************************************************
  registrarDispositivo(
    request: RegistrarDispositivoRequest,
  ): Observable<RegistrarDispositivoResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .post<RegistrarDispositivoResponse>(
        this.API_REGISTER_DISPOSITIVO,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar el dispositivo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER MIS DISPOSITIVOS
  // *********************************************************
  getMisDispositivos(): Observable<GetMisDispositivosResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetMisDispositivosResponse>(
        this.API_GET_MIS_DISPOSITIVOS,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener tus dispositivos.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. DESACTIVAR DISPOSITIVO
  // *********************************************************
  desactivarDispositivo(
    idDispositivo: number,
    request: DesactivarDispositivoRequest = {},
  ): Observable<DesactivarDispositivoResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .patch<DesactivarDispositivoResponse>(
        `${this.API_DESACTIVATED_DISPOSITIVO_BY_ID}${idDispositivo}/desactivar`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo desactivar el dispositivo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. DESACTIVAR DISPOSITIVO POR TOKEN
  // *********************************************************
  desactivarDispositivoPorToken(
    request: DesactivarDispositivoTokenRequest,
  ): Observable<DesactivarDispositivoTokenResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .patch<DesactivarDispositivoTokenResponse>(
        this.API_DESACTIVATED_DISPOSITIVO_BY_TOKEN,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo desactivar el dispositivo por token.',
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
