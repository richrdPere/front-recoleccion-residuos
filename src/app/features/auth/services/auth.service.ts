import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, tap } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

// Environment
import { environment } from '@environments/environment';


// Services
import { AuthStorageService, StoredSession, TokenExpiration } from 'src/app/core/auth/auth-storage.service';
// import { SocketService } from '../socket.service';
// import { MapaTrackingService } from '../mapa-tracking/mapa-tracking.service';

// Helpers
import { HttpServiceHelper } from 'src/app/core/auth/http-service.helper';

// Interfaces
import {
  AuthJwtPayload,
  AuthUser,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RefreshTokenResponse,
} from '../models';

// Requests adicionales
export interface ChangePasswordRequest {
  password_actual: string;
  nueva_password: string;
  confirmar_password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  // =========================================================
  // DEPENDENCIAS
  // =========================================================
  private readonly http = inject(HttpClient);
  private readonly authStorage = inject(AuthStorageService);
  private readonly jwtHelper = new JwtHelperService();

  // =========================================================
  // ENDPOINTS
  // =========================================================
  private readonly API_BASE: string = environment.apiUrl + 'auth';

  private readonly API_LOGIN = `${this.API_BASE}/login`;
  private readonly API_LOGOUT = `${this.API_BASE}/logout`;
  private readonly API_LOGOUT_ALL = `${this.API_BASE}/logout-all`;
  private readonly API_REFRESH = `${this.API_BASE}/refresh`;
  private readonly API_ME = `${this.API_BASE}/me`;
  private readonly API_CHANGE_PASSWORD = `${this.API_BASE}/change-password`;
  private readonly API_CREATE_USERS = `${this.API_BASE}/users`;

  // =========================================================
  // STORAGE KEYS
  // =========================================================
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'usuario';
  private readonly ROLES_KEY = 'roles';
  private readonly SESSION_KEY = 'sesion';
  private readonly EXPIRES_IN_KEY = 'expiresIn';

  // =========================================================
  // ESTADO DEL USUARIO
  // =========================================================
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    // private readonly socketService: SocketService,
    // private readonly mapaTrackingService: MapaTrackingService,
  ) {
    this.restoreSession();
  }

  // *********************************************************
  // 1. LOGIN
  // *********************************************************
  login(request: LoginRequest): Observable<LoginResponse> {

    // const dispositivoId = this.authStorage.getOrCreateDeviceId();
    const headers = this.getJsonHeaders();

    return this.http.post<LoginResponse>(this.API_LOGIN, request, { headers },
    ).pipe(
      tap((response) => {
        this.processLoginResponse(
          response,
          request.dispositivo_id,
        );

        // El socket utilizará el nuevo access token.
        // this.socketService.reconnect();
      }),
      catchError((error) =>
        HttpServiceHelper.handleError(
          error,
          'No se pudo iniciar sesión.',
        ),
      ),
    );
  }

  // *********************************************************
  // 2. LOGOUT
  // *********************************************************
  logout(): Observable<LogoutResponse> {
    const refreshToken = this.authStorage.getRefreshToken();
    const headers = this.getJsonHeaders();

    return this.http.post<LogoutResponse>(
      this.API_LOGOUT,
      {
        refreshToken,
      },
      {
        headers
      },
    ).pipe(
      catchError((error) =>
        HttpServiceHelper.handleError(
          error,
          'No se pudo cerrar la sesión en el servidor.',
        ),
      ),

      /*
       * La sesión local se elimina incluso si
       * el backend no está disponible.
       */
      finalize(() => {
        this.closeLocalSession();
      }),
    );
  }

  // *********************************************************
  // 3. CERRAR TODAS LAS SESIONES
  // *********************************************************
  logoutAll(): Observable<LogoutResponse> {
    const headers = this.getJsonHeaders();

    return this.http.post<LogoutResponse>(
      this.API_LOGOUT_ALL,
      {},
      {
        headers
      })
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron cerrar todas las sesiones.',
          ),
        ),

        finalize(() => {
          this.closeLocalSession();
        }),
      );
  }

  // *********************************************************
  // 4. RENOVAR TOKENS
  // *********************************************************
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.authStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error(
        'No existe un refresh token disponible.',
      );
    }

    return this.http
      .post<RefreshTokenResponse>(
        this.API_REFRESH,
        {
          refresh_token: refreshToken,
        },
        {
          headers: HttpServiceHelper.getHeaders(),
        },
      )
      .pipe(
        tap((response) => {
          const {
            access_token,
            refresh_token,
            expires_in,
            refresh_expires_in,
          } = response.data;

          this.authStorage.saveTokens(
            access_token,
            refresh_token,
            {
              accessToken: expires_in,
              refreshToken: refresh_expires_in,
            },
          );

          this.updateStoredSession(access_token);
        }),

        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo renovar la sesión.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. OBTENER USUARIO AUTENTICADO
  // *********************************************************
  getMe(): Observable<{
    success: boolean;
    message: string;
    data: AuthUser;
  }> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<{
        success: boolean;
        message: string;
        data: AuthUser;
      }>(
        this.API_ME,
        {
          headers
        },
      )
      .pipe(
        tap((response) => {
          const usuario = response.data;
          const roles = usuario.roles.map(
            (role) => role.nombre,
          );

          this.authStorage.saveUser(
            usuario,
            roles,
          );

          this.currentUserSubject.next(usuario);
        }),

        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el usuario autenticado.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. CAMBIAR CONTRASEÑA
  // *********************************************************
  changePassword(request: ChangePasswordRequest): Observable<unknown> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch(
        this.API_CHANGE_PASSWORD,
        request,
        {
          headers
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cambiar la contraseña.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. CREAR USUARIO
  // *********************************************************
  createUser<TRequest>(request: TRequest): Observable<unknown> {
    const headers = this.getJsonHeaders();

    return this.http
      .post(
        this.API_CREATE_USERS,
        request,
        {
          headers
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo crear el usuario.',
          ),
        ),
      );
  }


  // *********************************************************
  // FUNCTIONS
  // *********************************************************

  // - HEADER JSON
  private getJsonHeaders(): HttpHeaders {
    return HttpServiceHelper.getHeaders({
      token: this.authStorage.getAccessToken(),
    });
  }

  // - RESTAURAR SESSIÓN
  private restoreSession(): void {
    const accessToken = this.authStorage.getAccessToken();
    const refreshToken = this.authStorage.getRefreshToken();
    const savedUser = this.authStorage.getUser<AuthUser>();

    if (!accessToken || !refreshToken || !savedUser) {
      this.closeLocalSession();
      return;
    }

    /*
 * Antes de enviarlo a JwtHelperService comprobamos
 * que tenga la estructura básica de un JWT:
 *
 * header.payload.signature
 */
    if (!this.hasValidJwtStructure(accessToken)) {
      console.warn(
        'El access token almacenado no tiene una estructura JWT válida.',
      );

      this.clearInvalidSession();
      return;
    }

    /*
     * Si el access token sigue vigente, restauramos
     * inmediatamente el usuario.
     */
    if (!this.jwtHelper.isTokenExpired(accessToken)) {
      this.currentUserSubject.next(
        savedUser,
      );

      return;
    }

    /*
     * No eliminamos automáticamente la sesión si existe
     * refresh token. El guard o interceptor intentará
     * renovarla.
     */
    if (
      !this.jwtHelper.isTokenExpired(
        refreshToken,
      )
    ) {
      this.currentUserSubject.next(
        savedUser,
      );

      return;
    }

    this.closeLocalSession();
  }

  // - PROCESAR LOGIN
  private processLoginResponse(response: LoginResponse, dispositivoId: string): void {
    const {
      access_token,
      refresh_token,
      expires_in,
      refresh_expires_in,
      usuario,
    } = response.data;

    const payload = this.decodeAccessToken(access_token);

    if (!payload) {
      throw new Error(
        'El access token recibido no es válido.',
      );
    }

    const roles = usuario.roles.map(
      (role) => role.nombre,
    );

    const sesion: StoredSession = {
      sessionId: payload.session_id,
      dispositivoId,
      tipoDispositivo: 'WEB',
      fechaExpiracion: new Date(payload.exp * 1000).toISOString(),
    };

    const expiresIn: TokenExpiration = {
      accessToken: expires_in,
      refreshToken: refresh_expires_in,
    };

    this.authStorage.saveLogin({
      accessToken: access_token,
      refreshToken: refresh_token,

      expiresIn,
      sesion,
      roles,
      usuario,
    });

    this.currentUserSubject.next(usuario);

    /*
     * Posteriormente:
     *
     * this.socketService.reconnect();
     */
  }

  // - ACTUALIZAR INFORMACION DE SESSIÓN ALMACENADA
  private updateStoredSession(accessToken: string): void {
    const payload = this.decodeAccessToken(accessToken);
    const currentSession = this.authStorage.getSession();

    if (!payload || !currentSession) {
      return;
    }

    const updatedSession: StoredSession = {
      ...currentSession,

      sessionId: payload.session_id,
      fechaExpiracion: new Date(payload.exp * 1000).toISOString(),
    };

    /*
     * Para evitar exponer writeJson públicamente,
     * puedes añadir saveSession() al storage.
     */
    this.authStorage.saveSession(
      updatedSession,
    );
  }

  // - VALIDAR JWT CORRUPTA
  private hasValidJwtStructure(
    token: string | null,
  ): token is string {
    if (!token) {
      return false;
    }

    const normalizedToken = token
      .replace(/^Bearer\s+/i, '')
      .trim();

    if (
      normalizedToken === 'null' ||
      normalizedToken === 'undefined'
    ) {
      return false;
    }

    const parts = normalizedToken.split('.');

    return (
      parts.length === 3 &&
      parts.every((part) => part.length > 0)
    );
  }

  private clearInvalidSession(): void {
    this.authStorage.clearSession();
    this.currentUserSubject.next(null);
  }

  // - DECODIFICAR ACCESS TOKEN
  decodeAccessToken(token?: string | null): AuthJwtPayload | null {
    const accessToken = token ?? this.authStorage.getAccessToken();

    if (!accessToken) {
      return null;
    }

    try {
      return this.jwtHelper
        .decodeToken<AuthJwtPayload>(
          accessToken,
        );
    } catch {
      return null;
    }
  }

  // - CERRAR SESIÓN LOCAL
  closeLocalSession(): void {
    /*
     * Posteriormente:
     *
     * this.socketService.disconnect();
     * this.mapaTrackingService.limpiarTodo();
     */

    this.authStorage.clearSession();

    this.currentUserSubject.next(null);
  }

  // =========================================================
  // GETTERS
  // =========================================================
  getAccessToken(): string | null {
    return this.authStorage.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this.authStorage.getRefreshToken();
  }

  getToken(): string | null {
    return this.getAccessToken();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  getCurrentRoles(): string[] {
    return this.authStorage.getRoles();
  }

  // =========================================================
  // VALIDACIONES
  // =========================================================
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();

    if (!accessToken) {
      return false;
    }

    try {
      return !this.jwtHelper
        .isTokenExpired(accessToken);
    } catch {
      return false;
    }
  }

  canRefreshSession(): boolean {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    try {
      return !this.jwtHelper
        .isTokenExpired(refreshToken);
    } catch {
      return false;
    }
  }

  hasRole(requiredRole: string): boolean {
    return this.getCurrentRoles()
      .includes(requiredRole);
  }


  hasAnyRole(requiredRoles: readonly string[]): boolean {
    const currentRoles = this.getCurrentRoles();

    return requiredRoles.some(
      (role) =>
        currentRoles.includes(role),
    );
  }

  hasAllRoles(requiredRoles: readonly string[]): boolean {
    const currentRoles = this.getCurrentRoles();

    return requiredRoles.every(
      (role) =>
        currentRoles.includes(role),
    );
  }

}
