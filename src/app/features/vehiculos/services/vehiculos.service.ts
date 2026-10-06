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
import { ChangeVehiculoEstadoOperativoRequest, ChangeVehiculoEstadoResponse, CreateVehiculoRequest, CreateVehiculoResponse, DeleteVehiculoResponse, GetVehiculoByIdResponse, GetVehiculoSelectorResponse, GetVehiculosPaginatedResponse, UltimoCodigoResponse, UpdateVehiculoRequest, UpdateVehiculoResponse, VehiculoSelectorFilters, VehiculosPaginadosFilters } from '../models';

@Injectable({
  providedIn: 'root'
})
export class VehiculosService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'vehiculos';

  private readonly API_CREATE_VEHICULO: string = this.API_BASE + '/create';
  private readonly API_GET_VEHICULOS_PAGINATED: string = this.API_BASE + '/paginado';
  private readonly API_GET_VEHICULO_BY_ID: string = this.API_BASE + '/view/';
  private readonly API_UPDATE_VEHICULO: string = this.API_BASE + '/update/';
  private readonly API_PATCH_ESTADO_VEHICULO: string = this.API_BASE + '/estado/';
  private readonly API_DELETE_VEHICULO: string = this.API_BASE + '/delete/';
  private readonly API_GET_ULTIMO_CODIGO: string = this.API_BASE + '/codigo';
  private readonly API_GET_VEHICULO_SELECTOR = this.API_BASE + '/selector';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. OBTENER VEHÍCULOS PAGINADOS
  // *********************************************************
  getVehiculosPaginated(
    filters: VehiculosPaginadosFilters = {},
  ): Observable<GetVehiculosPaginatedResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetVehiculosPaginatedResponse>(
        this.API_GET_VEHICULOS_PAGINATED,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los vehículos.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER VEHÍCULO POR ID
  // *********************************************************
  getVehiculoById(idVehiculo: number): Observable<GetVehiculoByIdResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetVehiculoByIdResponse>(
        `${this.API_GET_VEHICULO_BY_ID}${idVehiculo}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el vehículo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. CREAR VEHÍCULO
  // *********************************************************
  createVehiculo(request: CreateVehiculoRequest): Observable<CreateVehiculoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .post<CreateVehiculoResponse>(
        this.API_CREATE_VEHICULO,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar el vehículo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. ACTUALIZAR VEHÍCULO
  // *********************************************************
  updateVehiculo(
    idVehiculo: number,
    request: UpdateVehiculoRequest,
  ): Observable<UpdateVehiculoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .put<UpdateVehiculoResponse>(
        `${this.API_UPDATE_VEHICULO}${idVehiculo}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el vehículo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. CAMBIAR ESTADO OPERATIVO
  // *********************************************************
  changeEstadoOperativo(
    idVehiculo: number,
    request: ChangeVehiculoEstadoOperativoRequest
  ): Observable<ChangeVehiculoEstadoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<ChangeVehiculoEstadoResponse>(
        `${this.API_BASE}/${idVehiculo}/estado-operativo`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cambiar el estado operativo del vehículo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. ACTIVAR O DESACTIVAR VEHÍCULO
  // *********************************************************
  changeEstado(
    idVehiculo: number,
    request: boolean,
  ): Observable<ChangeVehiculoEstadoResponse> {
    const headers =
      this.getJsonHeaders();

    return this.http
      .patch<ChangeVehiculoEstadoResponse>(
        `${this.API_PATCH_ESTADO_VEHICULO}${idVehiculo}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cambiar el estado del vehículo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. ELIMINAR VEHÍCULO
  // *********************************************************
  deleteVehiculo(
    idVehiculo: number,
  ): Observable<DeleteVehiculoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .delete<DeleteVehiculoResponse>(
        `${this.API_DELETE_VEHICULO}${idVehiculo}`,
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
  // 8. OBTENER ULTIMO CODIGO VEHICULO
  // *********************************************************
  getLastCodigoVehiculo(
  ): Observable<UltimoCodigoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<UltimoCodigoResponse>(
        this.API_GET_ULTIMO_CODIGO,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el último código de vehículo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 9. OBTENER SELECTOR DE VEHÍCULOS
  // *********************************************************
  getVehiculoSelector(
    filters: VehiculoSelectorFilters = {},
  ): Observable<GetVehiculoSelectorResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetVehiculoSelectorResponse>(
        this.API_GET_VEHICULO_SELECTOR,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el selector de vehículos.',
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
