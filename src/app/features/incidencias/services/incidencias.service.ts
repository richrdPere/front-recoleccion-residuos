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
import { AsignarResponsableIncidenciaRequest, AsignarResponsableIncidenciaResponse, ChangeIncidenciaEstadoRequest, ChangeIncidenciaEstadoResponse, ChangeIncidenciaHabilitacionRequest, ChangeIncidenciaHabilitacionResponse, DeleteIncidenciaResponse, GetIncidenciaArchivoResponse, GetIncidenciaArchivosResponse, GetIncidenciaByIdResponse, GetIncidenciasPaginatedResponse, IncidenciaId, IncidenciasPaginadasFilters } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class IncidenciasService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'incidencias';

  private readonly API_GET_INCIDENCIAS_PAGINATED: string = this.API_BASE + '/paginado';
  private readonly API_GET_INCIDENCIA_BY_ID: string = this.API_BASE + '/view/';
  private readonly API_PATCH_RESPONSABLE_INCIDENCIA: string = this.API_BASE + '/';
  private readonly API_PATCH_ESTADO_INCIDENCIA: string = this.API_BASE + '/';
  private readonly API_PATCH_HABILITACION_INCIDENCIA: string = this.API_BASE + '/';
  private readonly API_DELETE_INCIDENCIA: string = this.API_BASE + '/delete/';
  private readonly API_GET_INCIDENCIA_ARCHIVOS: string = this.API_BASE + '/';
  private readonly API_GET_INCIDENCIA_ARCHIVO: string = this.API_BASE + '/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. OBTENER INCIDENCIAS PAGINADAS
  // *********************************************************
  getIncidenciasPaginated(
    filters: IncidenciasPaginadasFilters = {},
  ): Observable<GetIncidenciasPaginatedResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetIncidenciasPaginatedResponse>(
        this.API_GET_INCIDENCIAS_PAGINATED,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las incidencias.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER INCIDENCIA POR ID
  // *********************************************************
  getIncidenciaById(
    idIncidencia: IncidenciaId,
  ): Observable<GetIncidenciaByIdResponse> {
    const headers = this.getJsonHeaders();

    const id = encodeURIComponent(
      String(idIncidencia),
    );

    return this.http
      .get<GetIncidenciaByIdResponse>(
        this.API_GET_INCIDENCIA_BY_ID + id,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el detalle de la incidencia.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. ASIGNAR O RETIRAR RESPONSABLE DE INCIDENCIA
  // *********************************************************
  asignarResponsable(
    idIncidencia: IncidenciaId,
    request: AsignarResponsableIncidenciaRequest,
  ): Observable<AsignarResponsableIncidenciaResponse> {
    const headers = this.getJsonHeaders();

    const id = encodeURIComponent(
      String(idIncidencia),
    );

    return this.http
      .patch<AsignarResponsableIncidenciaResponse>(
        `${this.API_PATCH_RESPONSABLE_INCIDENCIA}${id}/responsable`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el responsable de la incidencia.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. CAMBIAR ESTADO DE ATENCIÓN DE INCIDENCIA
  // *********************************************************
  changeIncidenciaEstado(
    idIncidencia: IncidenciaId,
    request: ChangeIncidenciaEstadoRequest,
  ): Observable<ChangeIncidenciaEstadoResponse> {
    const headers = this.getJsonHeaders();

    const id = encodeURIComponent(
      String(idIncidencia),
    );

    return this.http
      .patch<ChangeIncidenciaEstadoResponse>(
        `${this.API_PATCH_ESTADO_INCIDENCIA}${id}/estado`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el estado de la incidencia.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. HABILITAR / DESHABILITAR INCIDENCIA
  // *********************************************************
  changeIncidenciaHabilitacion(
    idIncidencia: IncidenciaId,
    request: ChangeIncidenciaHabilitacionRequest,
  ): Observable<ChangeIncidenciaHabilitacionResponse> {
    const headers = this.getJsonHeaders();

    const id = encodeURIComponent(
      String(idIncidencia),
    );

    return this.http
      .patch<ChangeIncidenciaHabilitacionResponse>(
        `${this.API_PATCH_HABILITACION_INCIDENCIA}${id}/habilitacion`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar la habilitación de la incidencia.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. ELIMINAR INCIDENCIA
  // *********************************************************
  deleteIncidencia(
    idIncidencia: IncidenciaId,
  ): Observable<DeleteIncidenciaResponse> {
    const headers = this.getJsonHeaders();

    const id = encodeURIComponent(
      String(idIncidencia),
    );

    return this.http
      .delete<DeleteIncidenciaResponse>(
        this.API_DELETE_INCIDENCIA + id,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar la incidencia.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. OBTENER ARCHIVOS DE UNA INCIDENCIA
  // *********************************************************
  getIncidenciaArchivos(
    idIncidencia: IncidenciaId,
  ): Observable<GetIncidenciaArchivosResponse> {
    const headers = this.getJsonHeaders();

    const id = encodeURIComponent(
      String(idIncidencia),
    );

    return this.http
      .get<GetIncidenciaArchivosResponse>(
        `${this.API_GET_INCIDENCIA_ARCHIVOS}${id}/archivos`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los archivos de la incidencia.',
          ),
        ),
      );
  }

  // *********************************************************
  // 8. OBTENER ARCHIVO POR INCIDENCIA E ID DE ARCHIVO
  // *********************************************************
  getIncidenciaArchivo(
    idIncidencia: IncidenciaId,
    idArchivo: IncidenciaId,
  ): Observable<GetIncidenciaArchivoResponse> {
    const headers = this.getJsonHeaders();

    const incidenciaId = encodeURIComponent(
      String(idIncidencia),
    );

    const archivoId = encodeURIComponent(
      String(idArchivo),
    );

    return this.http
      .get<GetIncidenciaArchivoResponse>(
        `${this.API_GET_INCIDENCIA_ARCHIVO}${incidenciaId}/archivos/${archivoId}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el archivo de la incidencia.',
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
