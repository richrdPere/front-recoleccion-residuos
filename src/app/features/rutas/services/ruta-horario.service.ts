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
import { ChangeRutaHorarioEstadoRequest, ChangeRutaHorarioEstadoResponse, CreateRutaHorarioRequest, CreateRutaHorarioResponse, DeleteRutaHorarioResponse, GetHorariosByRutaResponse, UpdateRutaHorarioRequest, UpdateRutaHorarioResponse } from '../interfaces/ruta-horario';

@Injectable({
  providedIn: 'root'
})
export class RutaHorarioService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'rutas';

  private readonly API_CREATE_RUTA_HORARIO: string = this.API_BASE + '/';
  private readonly API_GET_HORARIOS_BY_RUTA: string = this.API_BASE + '/';
  private readonly API_UPDATE_RUTA_HORARIO: string = this.API_BASE + '/';
  private readonly API_CHANGE_RUTA_HORARIO_ESTADO: string = this.API_BASE + '/';
  private readonly API_DELETE_RUTA_HORARIO: string = this.API_BASE + '/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. CREAR HORARIO DE RUTA
  // *********************************************************
  createRutaHorario(
    idRuta: number,
    request: CreateRutaHorarioRequest,
  ): Observable<CreateRutaHorarioResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .post<CreateRutaHorarioResponse>(
        `${this.API_CREATE_RUTA_HORARIO}${idRuta}/horarios`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar el horario de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER HORARIOS POR ID DE RUTA
  // *********************************************************
  getHorariosByRuta(idRuta: number): Observable<GetHorariosByRutaResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetHorariosByRutaResponse>(
        `${this.API_GET_HORARIOS_BY_RUTA}${idRuta}/horarios`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los horarios de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. ACTUALIZAR HORARIO DE RUTA
  // *********************************************************
  updateRutaHorario(
    idRuta: number,
    idRutaHorario: number,
    request: UpdateRutaHorarioRequest,
  ): Observable<UpdateRutaHorarioResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .put<UpdateRutaHorarioResponse>(
        `${this.API_UPDATE_RUTA_HORARIO}${idRuta}/horarios/${idRutaHorario}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el horario de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. CAMBIAR ESTADO DEL HORARIO
  // *********************************************************
  changeRutaHorarioEstado(
    idRuta: number,
    idRutaHorario: number,
    request: ChangeRutaHorarioEstadoRequest,
  ): Observable<ChangeRutaHorarioEstadoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<ChangeRutaHorarioEstadoResponse>(
        `${this.API_CHANGE_RUTA_HORARIO_ESTADO}/${idRuta}/horarios/${idRutaHorario}/estado`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cambiar el estado del horario.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. ELIMINAR HORARIO DE RUTA
  // *********************************************************
  deleteRutaHorario(
    idRuta: number,
    idRutaHorario: number,
  ): Observable<DeleteRutaHorarioResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .delete<DeleteRutaHorarioResponse>(
        `${this.API_DELETE_RUTA_HORARIO}${idRuta}/horarios/${idRutaHorario}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar el horario de la ruta.',
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
