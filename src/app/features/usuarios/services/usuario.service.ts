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
import { AddRolUsuarioRequest, AddRolUsuarioResponse, ChangeEstadoUsuarioRequest, ChangeEstadoUsuarioResponse, CreateUsuarioRequest, CreateUsuarioResponse, DeleteUsuarioResponse, GetRolesResponse, GetUsuarioByIdResponse, GetUsuarioRolesResponse, GetUsuarioSelectorResponse, GetUsuariosPaginatedResponse, GetUsuariosSinPersonalResponse, RemoveRolUsuarioResponse, ResetPasswordUsuarioRequest, ResetPasswordUsuarioResponse, UpdateUsuarioRequest, UpdateUsuarioResponse, UsuarioIdentificador, UsuarioRolesFilters, UsuarioSelectorFilters, UsuariosPaginadosFilters, UsuariosSinPersonalFilters } from '../interfaces';


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
  private readonly API_CREATE_USUARIO: string = this.API_BASE + '/create';
  private readonly API_GET_USUARIO_ROLES: string = this.API_BASE + '/';
  private readonly API_UPDATE_USUARIO: string = this.API_BASE + '/update/';
  private readonly API_CHANGE_ESTADO_USUARIO: string = this.API_BASE + '/estado/';
  private readonly API_RESET_PASSWORD_USUARIO: string = this.API_BASE + '/reset-password/';
  private readonly API_DELETE_USUARIO: string = this.API_BASE + '/delete/';

  // Gestion de roles
  private readonly API_ADD_ROL_USUARIO: string = this.API_BASE + '/';
  private readonly API_REMOVE_ROL_USUARIO: string = this.API_BASE + '/';
  private readonly API_GET_ROLES: string = this.API_BASE + '/roles';
  private readonly API_GET_USUARIOS_SIN_PERSONAL: string = this.API_BASE + '/sin-personal';

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
  // 7. CREAR USUARIO
  // *********************************************************
  createUsuario(
    request: CreateUsuarioRequest,
  ): Observable<CreateUsuarioResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .post<CreateUsuarioResponse>(
        this.API_CREATE_USUARIO,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar el usuario.',
          ),
        ),
      );
  }

  // *********************************************************
  // 8. ACTUALIZAR USUARIO
  // *********************************************************
  updateUsuario(
    idUsuario: UsuarioIdentificador,
    request: UpdateUsuarioRequest,
  ): Observable<UpdateUsuarioResponse> {
    const headers = this.getJsonHeaders();
    const usuarioId = encodeURIComponent(String(idUsuario));

    return this.http
      .put<UpdateUsuarioResponse>(
        `${this.API_UPDATE_USUARIO}${usuarioId}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el usuario.',
          ),
        ),
      );
  }

  // *********************************************************
  // 9. ACTIVAR O DESACTIVAR USUARIO
  // *********************************************************
  changeEstadoUsuario(
    idUsuario: UsuarioIdentificador,
    request: ChangeEstadoUsuarioRequest,
  ): Observable<ChangeEstadoUsuarioResponse> {
    const headers = this.getJsonHeaders();
    const usuarioId = encodeURIComponent(String(idUsuario));

    return this.http
      .patch<ChangeEstadoUsuarioResponse>(
        `${this.API_CHANGE_ESTADO_USUARIO}${usuarioId}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el estado del usuario.',
          ),
        ),
      );
  }

  // *********************************************************
  // 10. RESTABLECER CONTRASEÑA DEL USUARIO
  // *********************************************************
  resetPasswordUsuario(
    idUsuario: UsuarioIdentificador,
    request: ResetPasswordUsuarioRequest,
  ): Observable<ResetPasswordUsuarioResponse> {
    const headers = this.getJsonHeaders();
    const usuarioId = encodeURIComponent(String(idUsuario));

    return this.http
      .patch<ResetPasswordUsuarioResponse>(
        `${this.API_RESET_PASSWORD_USUARIO}${usuarioId}`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo restablecer la contraseña del usuario.',
          ),
        ),
      );
  }

  // *********************************************************
  // 11. ELIMINAR USUARIO
  // *********************************************************
  deleteUsuario(
    idUsuario: UsuarioIdentificador,
  ): Observable<DeleteUsuarioResponse> {
    const headers = this.getJsonHeaders();
    const usuarioId = encodeURIComponent(String(idUsuario));

    return this.http
      .delete<DeleteUsuarioResponse>(
        `${this.API_DELETE_USUARIO}${usuarioId}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar el usuario.',
          ),
        ),
      );
  }

  // *********************************************************
  // 12. OBTENER CATÁLOGO DE ROLES
  // *********************************************************
  getRoles(): Observable<GetRolesResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetRolesResponse>(
        this.API_GET_ROLES,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los roles.',
          ),
        ),
      );
  }

  // *********************************************************
  // 13. OBTENER USUARIOS DISPONIBLES PARA CREAR PERSONAL OPERATIVO
  // *********************************************************
  getUsuariosSinPersonal(
    filters: UsuariosSinPersonalFilters = {},
  ): Observable<GetUsuariosSinPersonalResponse> {
    const headers = this.getJsonHeaders();
    const params = HttpServiceHelper.buildParams(filters);

    return this.http
      .get<GetUsuariosSinPersonalResponse>(
        this.API_GET_USUARIOS_SIN_PERSONAL,
        { headers, params },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los usuarios disponibles.',
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
