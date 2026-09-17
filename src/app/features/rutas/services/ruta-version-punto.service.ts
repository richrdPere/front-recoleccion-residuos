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
import { CreateRutaPuntoRequest, CreateRutaPuntoResponse, DeleteRutaPuntoResponse, ReorderRutaPuntosRequest, ReorderRutaPuntosResponse, UpdateRutaPuntoRequest, UpdateRutaPuntoResponse } from '../interfaces/ruta-puntos';

@Injectable({
  providedIn: 'root'
})
export class RutaVersionPuntoService {


  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'rutas/versiones';

  private readonly API_CREATE_RUTA_PUNTO: string = this.API_BASE + '/';
  private readonly API_REORDER_RUTA_PUNTOS: string = this.API_BASE + '/';
  private readonly API_UPDATE_RUTA_PUNTO: string = this.API_BASE + '/';
  private readonly API_DELETE_RUTA_PUNTO: string = this.API_BASE + '/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. CREAR PUNTO DE RUTA
  // *********************************************************
  createRutaPunto(
    idRutaVersion: number,
    request: CreateRutaPuntoRequest,
  ): Observable<CreateRutaPuntoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .post<CreateRutaPuntoResponse>(
        `${this.API_CREATE_RUTA_PUNTO}${idRutaVersion}/puntos`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar el punto de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. ACTUALIZAR PUNTO DE RUTA
  // *********************************************************
  updateRutaPunto(
    idRutaVersion: number,
    idRutaPunto: number,
    request: UpdateRutaPuntoRequest,
  ): Observable<UpdateRutaPuntoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .put<UpdateRutaPuntoResponse>(
        `${this.API_UPDATE_RUTA_PUNTO}${idRutaVersion}/puntos/${idRutaPunto}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el punto de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. REORDENAR PUNTOS DE UNA VERSIÓN
  // *********************************************************
  reorderRutaPuntos(
    idRutaVersion: number,
    request: ReorderRutaPuntosRequest,
  ): Observable<ReorderRutaPuntosResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<ReorderRutaPuntosResponse>(
        `${this.API_REORDER_RUTA_PUNTOS}${idRutaVersion}/puntos/orden`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron reordenar los puntos de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. ELIMINAR PUNTO DE RUTA
  // *********************************************************
  deleteRutaPunto(
    idRutaVersion: number,
    idRutaPunto: number,
  ): Observable<DeleteRutaPuntoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .delete<DeleteRutaPuntoResponse>(
        `${this.API_DELETE_RUTA_PUNTO}${idRutaVersion}/puntos/${idRutaPunto}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar el punto de la ruta.',
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
