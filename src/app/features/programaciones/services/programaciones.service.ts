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
import { CancelProgramacionRequest, CancelProgramacionResponse, CreateProgramacionRequest, CreateProgramacionResponse, GetProgramacionByIdResponse, GetProgramacionesPaginatedResponse, ProgramacionesPaginadasFilters, UpdateProgramacionRequest, UpdateProgramacionResponse } from '../interfaces/programaciones';

@Injectable({
  providedIn: 'root'
})
export class ProgramacionesService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'programaciones';

  private readonly API_CREATE_PROGRAMACION: string = this.API_BASE + '/create';
  private readonly API_GET_PROGRAMACIONES_PAGINATED: string = this.API_BASE + '/paginado';
  private readonly API_UPDATE_PROGRAMACION: string = this.API_BASE + '/update/';
  private readonly API_CANCEL_PROGRAMACION: string = this.API_BASE + '/cancelar/';
  private readonly API_GET_PROGRAMACION_BY_ID: string = this.API_BASE + '/view/';
  private readonly API_DELETE_PROGRAMACION: string = this.API_BASE + '/view/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }


  // *********************************************************
  // 1. CREAR PROGRAMACION
  // *********************************************************
  createProgramacion(
    request: CreateProgramacionRequest,
  ): Observable<CreateProgramacionResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .post<CreateProgramacionResponse>(
        this.API_CREATE_PROGRAMACION,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo crear la programación.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER PROGRAMACIONES PAGINADAS
  // *********************************************************
  getProgramacionesPaginated(
    filters: ProgramacionesPaginadasFilters = {},
  ): Observable<GetProgramacionesPaginatedResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetProgramacionesPaginatedResponse>(
        this.API_GET_PROGRAMACIONES_PAGINATED,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las programaciones.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER PROGRAMACIÓN POR ID
  // *********************************************************
  getProgramacionById(
    idProgramacion: number,
  ): Observable<GetProgramacionByIdResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetProgramacionByIdResponse>(
        `${this.API_GET_PROGRAMACION_BY_ID}${idProgramacion}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la programación.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. ACTUALIZAR PROGRAMACIÓN
  // *********************************************************
  updateProgramacion(
    idProgramacion: number,
    request: UpdateProgramacionRequest,
  ): Observable<UpdateProgramacionResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .put<UpdateProgramacionResponse>(
        `${this.API_UPDATE_PROGRAMACION}${idProgramacion}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar la programación.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. CANCELAR PROGRAMACIÓN
  // *********************************************************
  cancelProgramacion(
    idProgramacion: number,
    request: CancelProgramacionRequest,
  ): Observable<CancelProgramacionResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<CancelProgramacionResponse>(
        `${this.API_CANCEL_PROGRAMACION}${idProgramacion}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cancelar la programación.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. ELIMINAR PROGRAMACIÓN
  // *********************************************************

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

