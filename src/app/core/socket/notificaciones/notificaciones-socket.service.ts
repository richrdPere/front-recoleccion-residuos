import { DestroyRef, Injectable, NgZone, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

// Environment
import { environment } from 'src/environments/environment';

// Services
import { AuthService } from 'src/app/features/auth/services/auth.service';

// Interfaces
import {
  ErrorNotificacionesSocket,
  EstadoNotificacionesSocket,
  EventoNotificacionesSocket,
  PayloadsNotificacionesSocket,
} from './notificaciones-socket.types';

@Injectable({
  providedIn: 'root',
})
export class NotificacionesSocketService {
  // =========================================================
  // DEPENDENCIAS
  // =========================================================

  private readonly auth = inject(AuthService);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private readonly browser = isPlatformBrowser(
    inject(PLATFORM_ID),
  );

  // =========================================================
  // CONEXIÓN
  // =========================================================

  private socket: Socket | null = null;

  private activo = false;
  private abriendo = false;
  private bloqueado = false;
  private renovar = false;

  private generacion = 0;

  private usuario: string | null = null;
  private token: string | null = null;

  private esperaMs = 1000;

  private reintento?: ReturnType<typeof setTimeout>;

  // =========================================================
  // ESTADO PÚBLICO
  // =========================================================

  private readonly estadoInterno = signal<EstadoNotificacionesSocket>(
    'DESCONECTADO',
  );

  private readonly errorInterno = signal<ErrorNotificacionesSocket | null>(
    null,
  );

  readonly estado = this.estadoInterno.asReadonly();
  readonly error = this.errorInterno.asReadonly();

  // =========================================================
  // EVENTOS
  // =========================================================

  private readonly eventosSubject =
    new Subject<EventoNotificacionesSocket>();

  private readonly sincronizarSubject =
    new Subject<{
      id_usuario: string;
    }>();

  private readonly sesionCerradaSubject =
    new Subject<void>();

  readonly eventos$ =
    this.eventosSubject.asObservable();

  /**
   * Se emite después de conectar o reconectar.
   * Permite recuperar el contador y la bandeja por REST.
   */
  readonly sincronizar$ =
    this.sincronizarSubject.asObservable();

  /**
   * Permite limpiar el estado de notificaciones
   * cuando se cierra o reemplaza la sesión.
   */
  readonly sesionCerrada$ =
    this.sesionCerradaSubject.asObservable();

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor() {
    // Login, restauración y cambios de usuario.
    this.auth.currentUser$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.activo) {
          this.sincronizarSesion();
        }
      });

    // Actualización del JWT desde AuthService.
    this.auth.tokensActualizados$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (
          !this.activo ||
          this.abriendo
        ) {
          return;
        }

        /*
         * Si la renovación fue solicitada por este servicio,
         * abrir() recogerá el token actualizado.
         */
        if (
          this.token !==
          this.auth.getAccessToken()
        ) {
          this.reconectar();
        }
      });

    // Logout o reemplazo de la sesión.
    this.auth.sesionCerrada$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.limpiarConexion();

        this.usuario = null;
        this.bloqueado = false;
        this.renovar = false;

        this.errorInterno.set(null);

        this.sesionCerradaSubject.next();
      });

    if (this.browser) {
      window.addEventListener(
        'online',
        this.alVolverLaRed,
      );
    }

    this.destroyRef.onDestroy(() => {
      this.detener();

      if (this.browser) {
        window.removeEventListener(
          'online',
          this.alVolverLaRed,
        );
      }

      this.eventosSubject.complete();
      this.sincronizarSubject.complete();
      this.sesionCerradaSubject.complete();
    });
  }

  // =========================================================
  // 1. INICIAR
  // =========================================================

  /**
   * Llamar una vez desde App.
   * Espera al login si todavía no existe una sesión.
   */
  iniciar(): void {
    if (
      !this.browser ||
      this.activo
    ) {
      return;
    }

    this.activo = true;

    this.sincronizarSesion();
  }

  // =========================================================
  // 2. DETENER
  // =========================================================

  detener(): void {
    this.activo = false;

    this.limpiarConexion();

    this.usuario = null;
    this.renovar = false;
    this.bloqueado = false;

    this.errorInterno.set(null);
  }

  // =========================================================
  // 3. RECONECTAR MANUALMENTE
  // =========================================================

  reconectar(): void {
    if (
      !this.activo ||
      !this.browser
    ) {
      return;
    }

    /*
     * Si hubo un rechazo definitivo, el reintento manual
     * solicita primero la renovación por REST.
     */
    this.renovar =
      this.renovar ||
      this.bloqueado;

    this.bloqueado = false;

    this.limpiarConexion();
    this.sincronizarSesion();
  }

  // =========================================================
  // 4. RECUPERACIÓN DE RED
  // =========================================================

  private readonly alVolverLaRed = (): void => {
    if (
      this.activo &&
      !this.bloqueado &&
      !this.socket?.connected
    ) {
      this.zone.run(() => {
        this.reconectar();
      });
    }
  };

  // =========================================================
  // 5. SINCRONIZAR SESIÓN
  // =========================================================

  private sincronizarSesion(): void {
    const id =
      this.auth.getCurrentUser()?.id_usuario;

    const usuario =
      id == null
        ? null
        : String(id);

    if (!usuario) {
      this.limpiarConexion();

      this.usuario = null;

      return;
    }

    if (usuario !== this.usuario) {
      this.limpiarConexion();

      this.usuario = usuario;
      this.bloqueado = false;
      this.renovar = false;
      this.esperaMs = 1000;
    }

    if (
      !this.socket &&
      !this.abriendo &&
      !this.reintento &&
      !this.bloqueado
    ) {
      void this.abrir();
    }
  }

  // =========================================================
  // 6. ABRIR CONEXIÓN
  // =========================================================

  private async abrir(): Promise<void> {
    const usuario = this.usuario;

    if (
      !this.activo ||
      !usuario ||
      this.abriendo ||
      this.bloqueado
    ) {
      return;
    }

    const generacion = this.generacion;

    this.abriendo = true;

    this.estadoInterno.set(
      this.renovar
        ? 'RENOVANDO_TOKEN'
        : 'CONECTANDO',
    );

    try {
      /*
       * Reutiliza la renovación compartida de AuthService.
       * Evita implementar otro flujo de refresh token.
       */
      const token = (
        await this.auth.getAccessTokenForSocket(
          this.renovar,
        )
      )
        ?.trim()
        .replace(/^Bearer\s+/i, '');

      if (
        !this.vigente(
          generacion,
          usuario,
        )
      ) {
        return;
      }

      if (!token) {
        this.bloquear({
          code: 'ACCESS_TOKEN_REQUIRED',
          statusCode: 401,
          message:
            'No hay una sesión disponible para recibir notificaciones.',
        });

        return;
      }

      this.renovar = false;
      this.token = token;

      const socket = io(
        environment.socketUrl,
        {
          path: '/socket.io',

          autoConnect: false,

          /*
           * Los reintentos los controla este servicio
           * para consultar el JWT vigente en cada conexión.
           */
          reconnection: false,

          forceNew: true,
          multiplex: false,

          timeout: 10000,

          auth: {
            token,
          },
        },
      );

      this.socket = socket;

      const actual = (): boolean => {
        return (
          this.vigente(
            generacion,
            usuario,
          ) &&
          this.socket === socket
        );
      };

      const dentro = (
        callback: () => void,
      ): void => {
        if (actual()) {
          this.zone.run(callback);
        }
      };

      // -----------------------------------------------------
      // CONECTADO
      // -----------------------------------------------------

      socket.on('connect', () => {
        dentro(() => {
          this.esperaMs = 1000;

          this.errorInterno.set(null);
          this.estadoInterno.set('CONECTADO');

          /*
           * El backend incorpora automáticamente el socket
           * a usuario:{id_usuario}.
           */
          this.sincronizarSubject.next({
            id_usuario: usuario,
          });
        });
      });

      // -----------------------------------------------------
      // DESCONECTADO
      // -----------------------------------------------------

      socket.on('disconnect', () => {
        dentro(() => {
          this.programarReintento();
        });
      });

      // -----------------------------------------------------
      // ERRORES
      // -----------------------------------------------------

      socket.on(
        'connect_error',
        (error: unknown) => {
          dentro(() => {
            this.procesarError(error);
          });
        },
      );

      socket.on(
        'auth:error',
        (error: unknown) => {
          dentro(() => {
            this.procesarError(error);
          });
        },
      );

      socket.on(
        'socket:error',
        (error: unknown) => {
          dentro(() => {
            this.procesarError(error);
          });
        },
      );

      // -----------------------------------------------------
      // EVENTOS DE NOTIFICACIONES
      // -----------------------------------------------------

      const escuchar = (
        evento: keyof PayloadsNotificacionesSocket,
      ): void => {
        socket.on(
          evento,
          (datos: unknown) => {
            dentro(() => {
              if (
                !socket.connected ||
                datos === null ||
                typeof datos !== 'object' ||
                Array.isArray(datos)
              ) {
                return;
              }

              const notificacion = {
                evento,
                id_usuario: usuario,
                datos,
              } as EventoNotificacionesSocket;

              this.eventosSubject.next(
                notificacion,
              );
            });
          },
        );
      };

      escuchar('notificacion:nueva');
      escuchar('notificacion:leida');
      escuchar('notificacion:todas-leidas');
      escuchar('notificacion:archivada');

      // -----------------------------------------------------
      // INICIAR TRANSPORTE
      // -----------------------------------------------------

      this.zone.runOutsideAngular(() => {
        socket.connect();
      });
    } catch (error: unknown) {
      if (
        !this.vigente(
          generacion,
          usuario,
        )
      ) {
        return;
      }

      this.procesarError(error);
    } finally {
      if (
        generacion === this.generacion
      ) {
        this.abriendo = false;
      }
    }
  }

  // =========================================================
  // 7. VALIDAR CONEXIÓN VIGENTE
  // =========================================================

  private vigente(
    generacion: number,
    usuario: string,
  ): boolean {
    return (
      this.activo &&
      generacion === this.generacion &&
      this.usuario === usuario &&
      String(
        this.auth.getCurrentUser()?.id_usuario ?? '',
      ) === usuario
    );
  }

  // =========================================================
  // 8. PROCESAR ERROR
  // =========================================================

  private procesarError(
    raw: unknown,
  ): void {
    const value = raw as {
      data?: Partial<ErrorNotificacionesSocket>;

      code?: string;
      message?: string;
      statusCode?: number;
      status?: number;
    } | null;

    const error: ErrorNotificacionesSocket = {
      code: String(
        value?.data?.code ??
        value?.code ??
        'SOCKET_CONNECTION_ERROR',
      ),

      message: String(
        value?.data?.message ??
        value?.message ??
        'No se pudo conectar con las notificaciones.',
      ),

      statusCode: Number(
        value?.data?.statusCode ??
        value?.statusCode ??
        value?.status ??
        0,
      ),
    };

    this.errorInterno.set(error);

    // Token vencido: renovar antes del siguiente intento.
    if (
      error.code === 'ACCESS_TOKEN_EXPIRED'
    ) {
      this.renovar = true;

      this.programarReintento();

      return;
    }

    // Rechazo definitivo: detener reintentos automáticos.
    if (
      error.statusCode === 401 ||
      error.statusCode === 403 ||
      [
        'ACCESS_TOKEN_REQUIRED',
        'INVALID_ACCESS_TOKEN',
        'INVALID_ACCESS_TOKEN_TYPE',
        'INVALID_ACCESS_TOKEN_PAYLOAD',
        'ACCESS_TOKEN_NOT_ACTIVE',
        'SESSION_REVOKED',
        'UNAUTHORIZED',
      ].includes(error.code)
    ) {
      this.bloquear(error);

      return;
    }

    // Fallos transitorios: reintentar conservando la sesión.
    this.programarReintento();
  }

  // =========================================================
  // 9. BLOQUEAR REINTENTOS
  // =========================================================

  private bloquear(
    error: ErrorNotificacionesSocket,
  ): void {
    this.limpiarConexion();

    this.bloqueado = true;

    this.errorInterno.set(error);

    this.estadoInterno.set(
      'AUTENTICACION_REQUERIDA',
    );
  }

  // =========================================================
  // 10. PROGRAMAR RECONEXIÓN
  // =========================================================

  private programarReintento(): void {
    if (
      !this.activo ||
      !this.usuario ||
      this.bloqueado ||
      this.reintento
    ) {
      return;
    }

    this.limpiarConexion();

    this.estadoInterno.set(
      'RECONECTANDO',
    );

    const espera = this.esperaMs;

    this.esperaMs = Math.min(
      30000,
      this.esperaMs * 2,
    );

    this.reintento = setTimeout(() => {
      this.zone.run(() => {
        this.reintento = undefined;

        this.sincronizarSesion();
      });
    }, espera);
  }

  // =========================================================
  // 11. LIMPIAR CONEXIÓN
  // =========================================================

  private limpiarConexion(): void {
    /*
     * Invalida callbacks y solicitudes de token
     * pertenecientes a la conexión anterior.
     */
    this.generacion++;

    this.abriendo = false;

    clearTimeout(this.reintento);
    this.reintento = undefined;

    const socket = this.socket;

    this.socket = null;
    this.token = null;

    socket?.removeAllListeners();
    socket?.disconnect();

    this.estadoInterno.set(
      'DESCONECTADO',
    );
  }
}
