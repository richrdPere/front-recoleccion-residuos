import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Service
import { AuthStorageService } from 'src/app/core/auth/auth-storage.service';

// Helper
import { HttpServiceHelper } from 'src/app/core/auth/http-service.helper';
import { ChangePersonalEstadoOperativoRequest, ChangePersonalEstadoResponse, CreatePersonalOperativoRequest, CreatePersonalOperativoResponse, DeletePersonalResponse, GetPersonalByIdResponse, GetPersonalPaginatedResponse, PersonalPaginadoFilters, UpdatePersonalOperativoRequest, UpdatePersonalOperativoResponse } from '../models';

// Interface


@Injectable({
  providedIn: 'root'
})
export class PersonalService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'personal';

  private readonly API_CREATE_PERSONAL: string = this.API_BASE + '/create';
  private readonly API_GET_PERSONAL_PAGINATED: string = this.API_BASE + '/paginado';
  private readonly API_GET_PERSONAL_BY_ID: string = this.API_BASE + '/view/';
  private readonly API_UPDATE_PERSONAL: string = this.API_BASE + '/update/';
  private readonly API_PATCH_ESTADO_PERSONAL: string = this.API_BASE + '/estado/';
  private readonly API_DELETE_PERSONAL: string = this.API_BASE + '/delete/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. OBTENER PERSONAL PAGINADO
  // *********************************************************
  getPersonalPaginated(
    filters: PersonalPaginadoFilters = {},
  ): Observable<GetPersonalPaginatedResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetPersonalPaginatedResponse>(
        this.API_GET_PERSONAL_PAGINATED,
        {
          params,
          headers,
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el personal operativo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. CREAR PERSONAL OPERATIVO
  // *********************************************************
  createPersonal(
    request: CreatePersonalOperativoRequest,
  ): Observable<CreatePersonalOperativoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .post<CreatePersonalOperativoResponse>(
        this.API_CREATE_PERSONAL,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar el personal operativo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER PERSONAL POR ID
  // *********************************************************
  getPersonalById(idPersonal: number): Observable<GetPersonalByIdResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetPersonalByIdResponse>(
        `${this.API_GET_PERSONAL_BY_ID}${idPersonal}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la información del personal operativo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. ACTUALIZAR PERSONAL OPERATIVO
  // *********************************************************
  updatePersonal(
    idPersonal: number,
    request: UpdatePersonalOperativoRequest,
  ): Observable<UpdatePersonalOperativoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .put<UpdatePersonalOperativoResponse>(
        `${this.API_UPDATE_PERSONAL}${idPersonal}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el personal operativo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. CAMBIAR ESTADO OPERATIVO
  // *********************************************************
  changeEstadoPersonalOperativo(
    idPersonal: number,
    request: ChangePersonalEstadoOperativoRequest
  ): Observable<ChangePersonalEstadoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<ChangePersonalEstadoResponse>(
        `${this.API_PATCH_ESTADO_PERSONAL}${idPersonal}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cambiar el estado operativo del personal operativo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. ELIMINAR PERSONAL OPERATIVO
  // *********************************************************
  deletePersonalOperativo(
    idVehiculo: number,
  ): Observable<DeletePersonalResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .delete<DeletePersonalResponse>(
        `${this.API_DELETE_PERSONAL}${idVehiculo}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar el personal operativo.',
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
