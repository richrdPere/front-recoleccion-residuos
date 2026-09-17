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
import { ChangeZonaEstadoRequest, ChangeZonaEstadoResponse, CreateZonaRequest, CreateZonaResponse, DeleteZonaResponse, GetZonaByIdResponse, GetZonasActivasResponse, GetZonasPaginatedResponse, UpdateZonaRequest, UpdateZonaResponse, ZonasPaginadasFilters } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ZonasServices {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'zonas';

  private readonly API_CREATE_ZONA: string = this.API_BASE + '/create';
  private readonly API_GET_ZONAS_PAGINATED: string = this.API_BASE + '/paginado';
  private readonly API_GET_ZONAS_ACTIVAS: string = this.API_BASE + '/activas';
  private readonly API_GET_ZONA_BY_ID: string = this.API_BASE + '/view/';
  private readonly API_UPDATE_ZONA: string = this.API_BASE + '/update/';
  private readonly API_PATCH_ESTADO_ZONA: string = this.API_BASE + '/estado/';
  private readonly API_DELETE_ZONA: string = this.API_BASE + '/delete/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. OBTENER ZONAS PAGINADAS
  // *********************************************************
  getZonasPaginated(
    filters: ZonasPaginadasFilters = {},
  ): Observable<GetZonasPaginatedResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetZonasPaginatedResponse>(
        this.API_GET_ZONAS_PAGINATED,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las zonas.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER ZONAS ACTIVAS
  // *********************************************************
  getZonasActivas(): Observable<GetZonasActivasResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetZonasActivasResponse>(
        this.API_GET_ZONAS_ACTIVAS,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las zonas activas.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER ZONA POR ID
  // *********************************************************
  getZonaById(
    idZona: number,
  ): Observable<GetZonaByIdResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetZonaByIdResponse>(
        `${this.API_GET_ZONA_BY_ID}${idZona}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la zona.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. CREAR ZONA
  // *********************************************************
  createZona(
    request: CreateZonaRequest,
  ): Observable<CreateZonaResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .post<CreateZonaResponse>(
        this.API_CREATE_ZONA,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar la zona.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. ACTUALIZAR ZONA
  // *********************************************************
  updateZona(
    idZona: number,
    request: UpdateZonaRequest,
  ): Observable<UpdateZonaResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .put<UpdateZonaResponse>(
        `${this.API_UPDATE_ZONA}${idZona}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar la zona.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. CAMBIAR ESTADO DE ZONA
  // *********************************************************
  changeZonaEstado(
    idZona: number,
    request: ChangeZonaEstadoRequest,
  ): Observable<ChangeZonaEstadoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<ChangeZonaEstadoResponse>(
        `${this.API_PATCH_ESTADO_ZONA}${idZona}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cambiar el estado de la zona.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. ELIMINAR VEHÍCULO
  // *********************************************************
  deleteZona(
    idZona: number,
  ): Observable<DeleteZonaResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .delete<DeleteZonaResponse>(
        `${this.API_DELETE_ZONA}${idZona}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar el vehículo.',
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
