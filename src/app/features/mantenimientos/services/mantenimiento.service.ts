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
import { CancelarMantenimientoRequest, CancelarMantenimientoResponse, CreateMantenimientoRequest, CreateMantenimientoResponse, FinalizarMantenimientoRequest, FinalizarMantenimientoResponse, GetMantenimientoByIdResponse, GetMantenimientosByVehiculoResponse, GetMantenimientosPaginadosResponse, GetMantenimientosProximosResponse, IniciarMantenimientoRequest, IniciarMantenimientoResponse, MantenimientoIdentificador, MantenimientosByVehiculoFilters, MantenimientosPaginadosFilters, MantenimientosProximosFilters, UpdateMantenimientoRequest, UpdateMantenimientoResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class MantenimientoService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'mantenimientos';

  // Consultas
  private readonly API_CREATE_MANTENIMIENTO: string = this.API_BASE + '/create';
  private readonly API_GET_MANTENIMIENTOS_PAGINADOS: string = this.API_BASE + '/paginado';
  private readonly API_GET_MANTENIMIENTO_BY_ID: String = this.API_BASE + '/view/';
  private readonly API_UPDATE_MANTENIMIENTO: string = this.API_BASE + '/update/';
  private readonly API_GET_MANTENIMIENTOS_PROXIMOS: string = this.API_BASE + '/proximos';
  private readonly API_GET_MANTENIMIENTOS_BY_VEHICULO: string = this.API_BASE + '/vehiculo/';
  private readonly API_INICIAR_MANTENIMIENTO: string = this.API_BASE + '/';
  private readonly API_FINALIZAR_MANTENIMIENTO: string = this.API_BASE + '/';
  private readonly API_CANCELAR_MANTENIMIENTO: string = this.API_BASE + '/';



  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. CREAR MANTENIMIENTO
  // *********************************************************
  createMantenimiento(
    request: CreateMantenimientoRequest,
  ): Observable<CreateMantenimientoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .post<CreateMantenimientoResponse>(
        this.API_CREATE_MANTENIMIENTO,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar el mantenimiento.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER MANTENIMIENTOS PAGINADOS
  // *********************************************************
  getMantenimientosPaginated(
    filters: MantenimientosPaginadosFilters = {},
  ): Observable<GetMantenimientosPaginadosResponse> {
    const headers = this.getJsonHeaders();
    const params = HttpServiceHelper.buildParams(filters);

    return this.http
      .get<GetMantenimientosPaginadosResponse>(
        this.API_GET_MANTENIMIENTOS_PAGINADOS,
        { headers, params },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los mantenimientos.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER MANTENIMIENTO POR ID
  // *********************************************************
  getMantenimientoById(
    idMantenimiento: MantenimientoIdentificador,
  ): Observable<GetMantenimientoByIdResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetMantenimientoByIdResponse>(
        `${this.API_GET_MANTENIMIENTO_BY_ID}${encodeURIComponent(String(idMantenimiento))}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el mantenimiento.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. ACTUALIZAR MANTENIMIENTO
  // *********************************************************
  updateMantenimiento(
    idMantenimiento: MantenimientoIdentificador,
    request: UpdateMantenimientoRequest,
  ): Observable<UpdateMantenimientoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .put<UpdateMantenimientoResponse>(
        `${this.API_UPDATE_MANTENIMIENTO}${encodeURIComponent(String(idMantenimiento))}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el mantenimiento.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. OBTENER PRÓXIMOS MANTENIMIENTOS
  // *********************************************************
  getMantenimientosProximos(
    filters: MantenimientosProximosFilters = {},
  ): Observable<GetMantenimientosProximosResponse> {
    const headers = this.getJsonHeaders();
    const params = HttpServiceHelper.buildParams(filters);

    return this.http
      .get<GetMantenimientosProximosResponse>(
        this.API_GET_MANTENIMIENTOS_PROXIMOS,
        { headers, params },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los próximos mantenimientos.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. INICIAR MANTENIMIENTO
  // *********************************************************
  iniciarMantenimiento(
    idMantenimiento: MantenimientoIdentificador,
    request: IniciarMantenimientoRequest = {},
  ): Observable<IniciarMantenimientoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<IniciarMantenimientoResponse>(
        `${this.API_INICIAR_MANTENIMIENTO}${encodeURIComponent(String(idMantenimiento))}/iniciar`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo iniciar el mantenimiento.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. FINALIZAR MANTENIMIENTO
  // *********************************************************
  finalizarMantenimiento(
    idMantenimiento: MantenimientoIdentificador,
    request: FinalizarMantenimientoRequest,
  ): Observable<FinalizarMantenimientoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<FinalizarMantenimientoResponse>(
        `${this.API_FINALIZAR_MANTENIMIENTO}${encodeURIComponent(String(idMantenimiento))}/finalizar`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo finalizar el mantenimiento.',
          ),
        ),
      );
  }

  // *********************************************************
  // 8. CANCELAR MANTENIMIENTO
  // *********************************************************
  cancelarMantenimiento(
    idMantenimiento: MantenimientoIdentificador,
    request: CancelarMantenimientoRequest,
  ): Observable<CancelarMantenimientoResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<CancelarMantenimientoResponse>(
        `${this.API_CANCELAR_MANTENIMIENTO}${encodeURIComponent(String(idMantenimiento))}/cancelar`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cancelar el mantenimiento.',
          ),
        ),
      );
  }

  // *********************************************************
  // 9. OBTENER HISTORIAL DE MANTENIMIENTOS DEL VEHÍCULO
  // *********************************************************
  getMantenimientosByVehiculo(
    idVehiculo: MantenimientoIdentificador,
    filters: MantenimientosByVehiculoFilters = {},
  ): Observable<GetMantenimientosByVehiculoResponse> {
    const headers = this.getJsonHeaders();
    const params = HttpServiceHelper.buildParams(filters);

    return this.http
      .get<GetMantenimientosByVehiculoResponse>(
        `${this.API_GET_MANTENIMIENTOS_BY_VEHICULO}${encodeURIComponent(String(idVehiculo))}`,
        { headers, params },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el historial de mantenimientos del vehículo.',
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
