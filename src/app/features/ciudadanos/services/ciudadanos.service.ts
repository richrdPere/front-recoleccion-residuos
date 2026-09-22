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
import { ActualizarDomicilioRequest, ActualizarDomicilioResponse, ActualizarPerfilCiudadanoRequest, ActualizarPreferenciasNotificacionRequest, ActualizarPreferenciasNotificacionResponse, CrearDomicilioRequest, CrearDomicilioResponse, CrearPerfilCiudadanoRequest, CrearPerfilCiudadanoResponse, EliminarDomicilioResponse, EstablecerDomicilioPrincipalResponse, GetDomicilioCronogramaParams, GetDomicilioCronogramaResponse, GetMisDomiciliosParams, GetMisDomiciliosResponse, GetPerfilCiudadanoResponse, GetPreferenciasNotificacionResponse, UpdatePerfilCiudadanoResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class CiudadanosService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'ciudadanos';

  // Perfil ciudadano
  private readonly API_CREATE_PERFIL_CIUDADANO: string = this.API_BASE + '/perfil';
  private readonly API_GET_PERFIL_CIUDADANO: string = this.API_BASE + '/me';
  private readonly API_UPDATE_PERFIL_CIUDADANO: string = this.API_BASE + '/me';

  // Preferencias de notificación
  private readonly API_GET_PREF_NOTIFICATION: string = this.API_BASE + '/preferencias-notificacion';
  private readonly API_UPDATE_PREF_NOTIFICATION: string = this.API_BASE + '/preferencias-notificacion';

  // Domicilios o direcciones
  private readonly API_GET_MIS_DIRECCIONES: string = this.API_BASE + '/domicilios';
  private readonly API_CREATE_DIRECCION: string = this.API_BASE + '/domicilios';
  private readonly API_PATCH_DIRECCION_PRINCIPAL: string = this.API_BASE + '/domicilios/';
  private readonly API_UPDATE_DIRECCION: string = this.API_BASE + '/domicilios/';
  private readonly API_DELETE_DIRECCION: string = this.API_BASE + '/domicilios/';
  private readonly API_GET_DIRECCION_CRONOGRAMA: string = this.API_BASE + '/domicilios/';


  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }


  // *********************************************************
  // 1. CREAR PERFIL CIUDADANO
  // *********************************************************
  crearPerfilCiudadano(
    request: CrearPerfilCiudadanoRequest,
  ): Observable<CrearPerfilCiudadanoResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .post<CrearPerfilCiudadanoResponse>(
        this.API_CREATE_PERFIL_CIUDADANO,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo crear el perfil ciudadano.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER MI PERFIL CIUDADANO
  // *********************************************************
  getMiPerfilCiudadano(): Observable<GetPerfilCiudadanoResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetPerfilCiudadanoResponse>(
        this.API_GET_PERFIL_CIUDADANO,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el perfil ciudadano.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. ACTUALIZAR MI PERFIL CIUDADANO
  // *********************************************************
  actualizarMiPerfilCiudadano(
    request: ActualizarPerfilCiudadanoRequest,
  ): Observable<UpdatePerfilCiudadanoResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .put<UpdatePerfilCiudadanoResponse>(
        this.API_UPDATE_PERFIL_CIUDADANO,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el perfil ciudadano.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. CREAR DOMICILIO
  // *********************************************************
  crearDomicilio(
    request: CrearDomicilioRequest,
  ): Observable<CrearDomicilioResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .post<CrearDomicilioResponse>(
        this.API_CREATE_DIRECCION,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar el domicilio.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. OBTENER MIS DOMICILIOS
  // *********************************************************
  getMisDomicilios(
    query: GetMisDomiciliosParams = {},
  ): Observable<GetMisDomiciliosResponse> {
    const params = HttpServiceHelper.buildParams(query);
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetMisDomiciliosResponse>(
        this.API_GET_MIS_DIRECCIONES,
        {
          headers,
          params,
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener tus domicilios.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. ACTUALIZAR DOMICILIO
  // *********************************************************
  actualizarDomicilio(
    idDomicilio: number,
    request: ActualizarDomicilioRequest,
  ): Observable<ActualizarDomicilioResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .put<ActualizarDomicilioResponse>(
        `${this.API_UPDATE_DIRECCION}${idDomicilio}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el domicilio.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. ESTABLECER DOMICILIO COMO PRINCIPAL
  // *********************************************************
  establecerDomicilioPrincipal(
    idDomicilio: number,
  ): Observable<EstablecerDomicilioPrincipalResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .patch<EstablecerDomicilioPrincipalResponse>(
        `${this.API_PATCH_DIRECCION_PRINCIPAL}${idDomicilio}/principal`,
        {},
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo establecer el domicilio como principal.',
          ),
        ),
      );
  }


  // *********************************************************
  // 8. OBTENER CRONOGRAMA POR DOMICILIO
  // *********************************************************
  getDomicilioCronograma(
    idDomicilio: number,
    query: GetDomicilioCronogramaParams = {},
  ): Observable<GetDomicilioCronogramaResponse> {
    const params = HttpServiceHelper.buildParams(query);
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetDomicilioCronogramaResponse>(
        `${this.API_GET_DIRECCION_CRONOGRAMA}${idDomicilio}/cronograma`,
        {
          headers,
          params,
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el cronograma del domicilio.',
          ),
        ),
      );
  }

  // *********************************************************
  // 9. OBTENER PREFERENCIAS DE NOTIFICACIÓN
  // *********************************************************
  getPreferenciasNotificacion():
    Observable<GetPreferenciasNotificacionResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetPreferenciasNotificacionResponse>(
        this.API_GET_PREF_NOTIFICATION,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las preferencias de notificación.',
          ),
        ),
      );
  }

  // *********************************************************
  // 10. ACTUALIZAR PREFERENCIAS DE NOTIFICACIÓN
  // *********************************************************
  actualizarPreferenciasNotificacion(
    request: ActualizarPreferenciasNotificacionRequest,
  ): Observable<ActualizarPreferenciasNotificacionResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .put<ActualizarPreferenciasNotificacionResponse>(
        this.API_UPDATE_PREF_NOTIFICATION,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron actualizar las preferencias de notificación.',
          ),
        ),
      );
  }

  // *********************************************************
  // 11. ELIMINAR DOMICILIO
  // *********************************************************
  eliminarDomicilio(
    idDomicilio: number,
  ): Observable<EliminarDomicilioResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .delete<EliminarDomicilioResponse>(
        `${this.API_DELETE_DIRECCION}${idDomicilio}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar el domicilio.',
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
