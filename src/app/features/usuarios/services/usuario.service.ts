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
import { AddRolUsuarioRequest, AddRolUsuarioResponse, GetUsuarioByIdResponse, GetUsuarioRolesResponse, GetUsuarioSelectorResponse, GetUsuariosPaginatedResponse, RemoveRolUsuarioResponse, UsuarioIdentificador, UsuarioRolesFilters, UsuarioSelectorFilters, UsuariosPaginadosFilters } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'usuarios';

  // Consultas
  private readonly API_GET_USUARIOS_PAGINATED: string = this.API_BASE + '/paginado';
  private readonly API_GET_USUARIO_SELECTOR: string = this.API_BASE + '/selector';
  private readonly API_GET_USUARIO_BY_ID: string = this.API_BASE + '/view';
  private readonly API_GET_USUARIO_ROLES: string = this.API_BASE + '/';

  // Gestion de roles
  private readonly API_ADD_ROL_USUARIO: string = this.API_BASE + '/';
  private readonly API_REMOVE_ROL_USUARIO: string = this.API_BASE + '/';


  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. OBTENER USUARIOS PAGINADOS
  // *********************************************************
  getUsuariosPaginated(
    filters: UsuariosPaginadosFilters = {},
  ): Observable<GetUsuariosPaginatedResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetUsuariosPaginatedResponse>(
        this.API_GET_USUARIOS_PAGINATED,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los usuarios.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER SELECTOR DE USUARIOS
  // *********************************************************
  getUsuarioSelector(
    filters: UsuarioSelectorFilters = {},
  ): Observable<GetUsuarioSelectorResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetUsuarioSelectorResponse>(
        this.API_GET_USUARIO_SELECTOR,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el selector de usuarios.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER USUARIO POR ID
  // *********************************************************
  getUsuarioById(
    idUsuario: UsuarioIdentificador,
  ): Observable<GetUsuarioByIdResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetUsuarioByIdResponse>(
        `${this.API_GET_USUARIO_BY_ID}/${encodeURIComponent(String(idUsuario))}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el detalle del usuario.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER ROLES DE UN USUARIO
  // *********************************************************
  getUsuarioRoles(
    idUsuario: UsuarioIdentificador,
    filters: UsuarioRolesFilters = {},
  ): Observable<GetUsuarioRolesResponse> {
    const params = HttpServiceHelper.buildParams(filters);
    const headers = this.getJsonHeaders();

    const usuarioId = encodeURIComponent(String(idUsuario));

    return this.http
      .get<GetUsuarioRolesResponse>(
        `${this.API_GET_USUARIO_ROLES}${usuarioId}/roles`,
        { params, headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los roles del usuario.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. AGREGAR O REACTIVAR ROL DE UN USUARIO
  // *********************************************************
  addRolUsuario(
    idUsuario: UsuarioIdentificador,
    request: AddRolUsuarioRequest,
  ): Observable<AddRolUsuarioResponse> {
    const headers = this.getJsonHeaders();
    const usuarioId = encodeURIComponent(String(idUsuario));

    return this.http
      .post<AddRolUsuarioResponse>(
        `${this.API_ADD_ROL_USUARIO}${usuarioId}/roles`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo asignar el rol al usuario.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. REMOVER ROL DE UN USUARIO
  // *********************************************************
  removeRolUsuario(
    idUsuario: UsuarioIdentificador,
    idRol: UsuarioIdentificador,
  ): Observable<RemoveRolUsuarioResponse> {
    const headers = this.getJsonHeaders();

    const usuarioId = encodeURIComponent(String(idUsuario));
    const rolId = encodeURIComponent(String(idRol));

    return this.http
      .delete<RemoveRolUsuarioResponse>(
        `${this.API_REMOVE_ROL_USUARIO}${usuarioId}/roles/${rolId}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo remover el rol del usuario.',
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
