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
import { ChangeEstadoConductorRequest, ChangeEstadoConductorResponse, ConductorIdentificador, CreateConductorRequest, CreateConductorResponse, GetPerfilConductorResponse, PerfilConductorIdentificador, UpdateConductorRequest, UpdateConductorResponse } from '../models/conductor';

@Injectable({
  providedIn: 'root'
})
export class ConductorService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'personal';

  private readonly API_CREATE_CONDUCTOR: string = this.API_BASE + '/';
  private readonly API_GET_CONDUCTOR_BY_ID: string = this.API_BASE + '/';
  private readonly API_UPDATE_CONDUCTOR: string = this.API_BASE + '/';
  private readonly API_PATCH_ESTADO_CONDUCTOR: string = this.API_BASE + '/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. CREAR PERFIL DE CONDUCTOR
  // *********************************************************
  createConductor(
    idPersonal: ConductorIdentificador,
    request: CreateConductorRequest,
  ): Observable<CreateConductorResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .post<CreateConductorResponse>(
        `${this.API_CREATE_CONDUCTOR}${encodeURIComponent(String(idPersonal))}/conductor`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar el perfil de conductor.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER PERFIL DEL CONDUCTOR
  // *********************************************************
  getPerfilConductor(
    idPersonal: PerfilConductorIdentificador,
  ): Observable<GetPerfilConductorResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetPerfilConductorResponse>(
        `${this.API_GET_CONDUCTOR_BY_ID}${encodeURIComponent(String(idPersonal))}/conductor`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el perfil del conductor.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. ACTUALIZAR PERFIL DEL CONDUCTOR
  // *********************************************************
  updateConductor(
    idPersonal: PerfilConductorIdentificador,
    request: UpdateConductorRequest,
  ): Observable<UpdateConductorResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .put<UpdateConductorResponse>(
        `${this.API_UPDATE_CONDUCTOR}${encodeURIComponent(String(idPersonal))}/conductor`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el perfil del conductor.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. CAMBIAR ESTADO DEL PERFIL DE CONDUCTOR
  // *********************************************************
  changeEstadoConductor(
    idPersonal: PerfilConductorIdentificador,
    request: ChangeEstadoConductorRequest,
  ): Observable<ChangeEstadoConductorResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<ChangeEstadoConductorResponse>(
        `${this.API_PATCH_ESTADO_CONDUCTOR}${encodeURIComponent(String(idPersonal))}/conductor/estado`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el estado del perfil de conductor.',
          ),
        ),
      );
  }

  // *********************************************************
  // MÉTODOS PRIVADOS
  // *********************************************************
  private getJsonHeaders(): HttpHeaders {
    return HttpServiceHelper.getHeaders({
      token: this.authStorage.getAccessToken(),
    });
  }
}
