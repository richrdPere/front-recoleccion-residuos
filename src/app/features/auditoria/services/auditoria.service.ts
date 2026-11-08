import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, from, Observable, switchMap } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Service
import { AuthStorageService } from 'src/app/core/auth/auth-storage.service';

// Helper
import { HttpServiceHelper } from 'src/app/core/auth/http-service.helper';

// Interfaces
import { AuditoriaEntidadFilters, AuditoriaId, AuditoriaPaginadoFilters, GetAuditoriaByEntidadResponse, GetAuditoriaByIdResponse, GetAuditoriaPaginadoResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************

  private readonly API_BASE = environment.apiUrl + 'auditoria';

  private readonly API_GET_AUDITORIA_PAGINADO: string = this.API_BASE + '/paginado';
  private readonly API_GET_AUDITORIA_BY_ID: string = this.API_BASE + '/view';
  private readonly API_GET_AUDITORIA_BY_ENTIDAD: string = this.API_BASE + '/entidad';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService,
  ) { }

  // *********************************************************
  // 1. OBTENER AUDITORÍA PAGINADA
  // *********************************************************
  getAuditoriaPaginado(
    filters: AuditoriaPaginadoFilters,
  ): Observable<GetAuditoriaPaginadoResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetAuditoriaPaginadoResponse>(
        this.API_GET_AUDITORIA_PAGINADO,
        { params, headers },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los eventos de auditoría.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER DETALLE DE UN EVENTO
  // *********************************************************
  getAuditoriaById(
    idAuditoria: AuditoriaId,
  ): Observable<GetAuditoriaByIdResponse> {
    const headers = this.getJsonHeaders();

    const id = encodeURIComponent(
      String(idAuditoria),
    );

    return this.http
      .get<GetAuditoriaByIdResponse>(
        `${this.API_GET_AUDITORIA_BY_ID}/${id}`,
        {
          headers,
        },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el evento de auditoría.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER HISTORIAL DE AUDITORÍA DE UNA ENTIDAD
  // *********************************************************

  getAuditoriaByEntidad(
    tipoEntidad: string,
    idEntidad: AuditoriaId,
    filters: AuditoriaEntidadFilters,
  ): Observable<GetAuditoriaByEntidadResponse> {
    const headers = this.getJsonHeaders();

    // Evita enviar estos parámetros en el query incluso si
    // el objeto recibido contiene propiedades adicionales.
    const {
      tipo_entidad: _tipoEntidad,
      id_entidad: _idEntidad,
      ...filtrosConsulta
    } = filters as AuditoriaPaginadoFilters;

    const params = HttpServiceHelper.buildParams(
      filtrosConsulta,
    );

    const tipo = encodeURIComponent(tipoEntidad);
    const id = encodeURIComponent(String(idEntidad));

    return this.http
      .get<GetAuditoriaByEntidadResponse>(
        `${this.API_GET_AUDITORIA_BY_ENTIDAD}/${tipo}/${id}`,
        {
          params,
          headers,
        },
      )
      .pipe(
        catchError((error: unknown) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el historial de auditoría de la entidad.',
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
