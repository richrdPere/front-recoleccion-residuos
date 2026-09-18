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
import { AnularEvidenciaRequest, AnularEvidenciaResponse, AnularRecoleccionRequest, AnularRecoleccionResponse, GetCapacidadRecorridoResponse, GetPuntosRecorridoResponse, GetRecoleccionByIdResponse, GetRecoleccionEvidenciasResponse, GetRecorridoProgresoResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class RecoleccionesService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'recolecciones';

  private readonly API_GET_PUNTOS_RECORRIDO: string = this.API_BASE + '/recorridos/';
  private readonly API_GET_RECORRIDO_PROGRESO: string = this.API_BASE + '/recorridos/';
  private readonly API_ANULAR_EVIDENCIA: string = this.API_BASE + '/evidencias/';
  private readonly API_GET_EVIDENCIAS: string = this.API_BASE + '/';
  private readonly API_ANULAR_RECOLECCION: string = this.API_BASE + '/';
  private readonly API_GET_CAPACIDAD_RECOLECCION: string = this.API_BASE + '/capacidad/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }


  // *********************************************************
  // 1. OBTENER PUNTOS DEL RECORRIDO
  // *********************************************************
  getPuntosRecorrido(
    idRecorrido: number,
  ): Observable<GetPuntosRecorridoResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetPuntosRecorridoResponse>(
        `${this.API_GET_PUNTOS_RECORRIDO}${idRecorrido}/puntos`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los puntos del recorrido.',
          ),
        ),
      );
  }


  // *********************************************************
  // 2. OBTENER PROGRESO DEL RECORRIDO
  // *********************************************************
  getRecorridoProgreso(
    idRecorrido: number,
  ): Observable<GetRecorridoProgresoResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetRecorridoProgresoResponse>(
        `${this.API_GET_RECORRIDO_PROGRESO}${idRecorrido}/progreso`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el progreso del recorrido.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. ANULAR EVIDENCIA
  // *********************************************************
  anularEvidencia(
    idEvidencia: number,
    request: AnularEvidenciaRequest,
  ): Observable<AnularEvidenciaResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .patch<AnularEvidenciaResponse>(
        `${this.API_ANULAR_EVIDENCIA}${idEvidencia}/anular`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo anular la evidencia.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER EVIDENCIAS DE UNA RECOLECCIÓN
  // *********************************************************
  getRecoleccionEvidencias(
    idRecoleccion: number,
  ): Observable<GetRecoleccionEvidenciasResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetRecoleccionEvidenciasResponse>(
        `${this.API_GET_EVIDENCIAS}${idRecoleccion}/evidencias`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las evidencias de la recolección.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. ANULAR RECOLECCIÓN
  // *********************************************************
  anularRecoleccion(
    idRecoleccion: number,
    request: AnularRecoleccionRequest,
  ): Observable<AnularRecoleccionResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .patch<AnularRecoleccionResponse>(
        `${this.API_ANULAR_RECOLECCION}${idRecoleccion}/anular`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo anular la recolección.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. OBTENER RECOLECCIÓN POR ID
  // *********************************************************
  getRecoleccionById(
    idRecoleccion: number,
  ): Observable<GetRecoleccionByIdResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetRecoleccionByIdResponse>(
        `${this.API_BASE}/view/${idRecoleccion}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el detalle de la recolección.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. OBTENER CAPACIDAD DEL VEHÍCULO EN EL RECORRIDO
  // *********************************************************
  getCapacidadRecorrido(
    idRecorrido: number,
  ): Observable<GetCapacidadRecorridoResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetCapacidadRecorridoResponse>(
        `${this.API_GET_CAPACIDAD_RECOLECCION}${idRecorrido}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la capacidad del vehículo.',
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
