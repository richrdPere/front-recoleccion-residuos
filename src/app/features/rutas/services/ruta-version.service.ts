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
import { ActivateRutaVersionResponse, CreateRutaVersionRequest, CreateRutaVersionResponse, DeleteRutaVersionResponse, GetVersionesByRutaResponse, GetVersionVigenteByRutaResponse, UpdateRutaVersionRequest, UpdateRutaVersionResponse } from '../interfaces/ruta-versiones';

@Injectable({
  providedIn: 'root'
})
export class RutaVersionService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'rutas';

  private readonly API_CREATE_RUTA_VERSION: string = this.API_BASE + '/';
  private readonly API_GET_VERSIONES_BY_RUTA: string = this.API_BASE + '/';
  private readonly API_GET_VERSION_VIGENTE_BY_RUTA: string = this.API_BASE + '/';
  private readonly API_UPDATE_RUTA_VERSION: string = this.API_BASE + '/versiones/';
  private readonly API_ACTIVATE_RUTA_VERSION: string = this.API_BASE + '/versiones/';
  private readonly API_DELETE_RUTA_VERSION: string = this.API_BASE + '/versiones/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. CREAR VERSIÓN DE RUTA
  // *********************************************************
  createRutaVersion(
    idRuta: number,
    request: CreateRutaVersionRequest,
  ): Observable<CreateRutaVersionResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .post<CreateRutaVersionResponse>(
        `${this.API_CREATE_RUTA_VERSION}${idRuta}/versiones`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar la versión de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER VERSIONES POR ID DE RUTA
  // *********************************************************
  getVersionesByRuta(idRuta: number): Observable<GetVersionesByRutaResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetVersionesByRutaResponse>(
        `${this.API_GET_VERSIONES_BY_RUTA}${idRuta}/versiones`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las versiones de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER VERSIÓN VIGENTE POR ID DE RUTA
  // *********************************************************
  getVersionVigenteByRuta(
    idRuta: number,
  ): Observable<GetVersionVigenteByRutaResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetVersionVigenteByRutaResponse>(
        `${this.API_GET_VERSION_VIGENTE_BY_RUTA}${idRuta}/version-vigente`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la versión vigente de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. ACTUALIZAR VERSIÓN DE RUTA
  // *********************************************************
  updateRutaVersion(
    idRutaVersion: number,
    request: UpdateRutaVersionRequest,
  ): Observable<UpdateRutaVersionResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .put<UpdateRutaVersionResponse>(
        `${this.API_UPDATE_RUTA_VERSION}${idRutaVersion}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar la versión de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. ACTIVAR VERSIÓN DE RUTA COMO VIGENTE
  // *********************************************************
  activateRutaVersion(idRutaVersion: number): Observable<ActivateRutaVersionResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<ActivateRutaVersionResponse>(
        `${this.API_ACTIVATE_RUTA_VERSION}${idRutaVersion}/activar`,
        null,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo activar la versión de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. ELIMINAR VERSIÓN DE RUTA
  // *********************************************************
  deleteRutaVersion(
    idRutaVersion: number,
  ): Observable<DeleteRutaVersionResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .delete<DeleteRutaVersionResponse>(
        `${this.API_DELETE_RUTA_VERSION}${idRutaVersion}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar la versión de la ruta.',
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
