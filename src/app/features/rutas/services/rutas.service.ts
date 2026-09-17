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
import { ChangeRutaEstadoOperativoRequest, ChangeRutaEstadoOperativoResponse, ChangeRutaEstadoRequest, ChangeRutaEstadoResponse, CreateRutaRequest, CreateRutaResponse, DeleteRutaResponse, GetRutaByIdResponse, GetRutasActivasResponse, GetRutasPaginatedResponse, RutasPaginadasFilters, UpdateRutaRequest, UpdateRutaResponse } from '../interfaces/rutas';
import { GetRutasByZonaResponse } from '../interfaces/rutas/get-ruta-by-zona-id.interface';

@Injectable({
  providedIn: 'root'
})
export class RutasServices {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'rutas';

  private readonly API_CREATE_RUTA: string = this.API_BASE + '/create';
  private readonly API_GET_RUTAS_PAGINATED: string = this.API_BASE + '/paginado';
  private readonly API_GET_RUTAS_BY_ZONA: string = this.API_BASE + '/activas';
  private readonly API_GET_RUTAS_ACTIVAS: string = this.API_BASE + '/activas';
  private readonly API_GET_RUTA_BY_ZONA_ID: string = this.API_BASE + '/view/';
  private readonly API_GET_RUTA_BY_ID: string = this.API_BASE + '/view/';
  private readonly API_UPDATE_RUTA: string = this.API_BASE + '/update/';
  private readonly API_CHANGE_RUTA_ESTADO_OPERATIVO: string = this.API_BASE + '/estado-ruta/';
  private readonly API_CHANGE_RUTA_ESTADO: string = this.API_BASE + '/estado/';
  private readonly API_DELETE_RUTA: string = this.API_BASE + '/delete/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }


  // *********************************************************
  // 1. CREAR RUTA
  // *********************************************************
  createRuta(
    request: CreateRutaRequest,
  ): Observable<CreateRutaResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .post<CreateRutaResponse>(
        this.API_CREATE_RUTA,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER RUTAS PAGINADAS
  // *********************************************************
  getRutasPaginated(
    filters: RutasPaginadasFilters = {},
  ): Observable<GetRutasPaginatedResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetRutasPaginatedResponse>(
        this.API_GET_RUTAS_PAGINATED,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las rutas.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER RUTAS POR ZONA
  // *********************************************************
  getRutasByZona(
    idZona: number,
  ): Observable<GetRutasByZonaResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetRutasByZonaResponse>(
        `${this.API_GET_RUTAS_BY_ZONA}${idZona}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las rutas de la zona.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. ACTUALIZAR RUTA
  // *********************************************************
  updateRuta(
    idRuta: number,
    request: UpdateRutaRequest,
  ): Observable<UpdateRutaResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .put<UpdateRutaResponse>(
        `${this.API_UPDATE_RUTA}${idRuta}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. CAMBIAR ESTADO OPERATIVO DE RUTA
  // *********************************************************
  changeRutaEstadoOperativo(
    idRuta: number,
    request: ChangeRutaEstadoOperativoRequest,
  ): Observable<ChangeRutaEstadoOperativoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<ChangeRutaEstadoOperativoResponse>(
        `${this.API_CHANGE_RUTA_ESTADO_OPERATIVO}${idRuta}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el estado operativo de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. OBTENER RUTAS ACTIVAS
  // *********************************************************
  getRutasActivas(): Observable<GetRutasActivasResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetRutasActivasResponse>(
        this.API_GET_RUTAS_ACTIVAS,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las rutas activas.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. OBTENER RUTA POR ID
  // *********************************************************
  getRutaById(
    idRuta: number,
  ): Observable<GetRutaByIdResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetRutaByIdResponse>(
        `${this.API_GET_RUTA_BY_ID}${idRuta}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 8. CAMBIAR ESTADO DEL REGISTRO DE RUTA
  // *********************************************************
  changeRutaEstado(
    idRuta: number,
    request: ChangeRutaEstadoRequest,
  ): Observable<ChangeRutaEstadoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<ChangeRutaEstadoResponse>(
        `${this.API_CHANGE_RUTA_ESTADO}${idRuta}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cambiar el estado del registro de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 9. ELIMINAR RUTA
  // *********************************************************
  deleteVehiculo(idRuta: number): Observable<DeleteRutaResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .delete<DeleteRutaResponse>(
        `${this.API_DELETE_RUTA}${idRuta}`,
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
