import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, EMPTY, Observable, Subject, catchError, debounceTime, defer, distinctUntilChanged, filter, forkJoin, from, map, merge, of, switchMap } from 'rxjs';

// Autenticación
import { AuthService } from 'src/app/features/auth/services/auth.service';

// Socket
import { NotificacionesSocketService } from 'src/app/core/socket/notificaciones/notificaciones-socket.service';

// HTTP
import { NotificacionesService } from './notificaciones.service';

// Interfaces
import { ApiResponse } from 'src/app/core/models/api-response.model';
import { MiNotificacionItem } from '../interfaces/notificaciones/get-mis-notificaciones.interface';


// =========================================================
// ESTADO COMPARTIDO
// =========================================================

export interface NotificacionesEstado {
  idUsuario: string | null;

  totalNoLeidas: number;
  avisosRecientes: MiNotificacionItem[];

  isLoading: boolean;
  errorMessage: string | null;

  ultimaSincronizacion: string | null;
}

// =========================================================
// RESULTADO INTERNO DE UNA CONSULTA
// =========================================================

interface ResultadoConsulta<T> {
  data: T | null;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class NotificacionesEstadoService {
  // =========================================================
  // DEPENDENCIAS
  // =========================================================

  private readonly auth = inject(AuthService);

  private readonly api = inject(NotificacionesService);

  private readonly socket = inject(NotificacionesSocketService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  // =========================================================
  // CONFIGURACIÓN
  // =========================================================

  private iniciado = false;

  private readonly limiteRecientes = 5;

  private readonly actualizarSubject = new Subject<void>();

  // =========================================================
  // ESTADO
  // =========================================================

  private readonly estadoSubject = new BehaviorSubject<NotificacionesEstado>(
    this.crearEstadoInicial(),
  );

  readonly estado$ = this.estadoSubject.asObservable();

  // =========================================================
  // OBSERVABLES PARA LOS COMPONENTES
  // =========================================================

  readonly totalNoLeidas$ = this.estado$.pipe(
    map(
      (estado) => estado.totalNoLeidas,
    ),
    distinctUntilChanged(),
  );

  readonly avisosRecientes$ = this.estado$.pipe(
    map(
      (estado) => estado.avisosRecientes,
    ),
    distinctUntilChanged(),
  );

  readonly isLoading$ = this.estado$.pipe(
    map(
      (estado) => estado.isLoading,
    ),
    distinctUntilChanged(),
  );

  readonly errorMessage$ = this.estado$.pipe(
    map(
      (estado) => estado.errorMessage,
    ),
    distinctUntilChanged(),
  );

  // =========================================================
  // 1. INICIAR SINCRONIZACIÓN
  // =========================================================

  iniciar(): void {
    if (
      !this.browser ||
      this.iniciado
    ) {
      return;
    }

    this.iniciado = true;

    /*
     * currentUser$ cubre:
     * - Sesión restaurada.
     * - Login.
     * - Cambio de usuario.
     * - Logout.
     *
     * sesionCerrada$ también invalida las consultas cuando
     * AuthService reemplaza una sesión por otra del mismo usuario.
     */
    const usuario$ = merge(
      this.auth.currentUser$.pipe(
        map(
          (usuario) =>
            usuario
              ? String(usuario.id_usuario)
              : null,
        ),
      ),

      this.socket.sesionCerrada$.pipe(
        map((): string | null => null),
      ),
    ).pipe(
      distinctUntilChanged(),
    );

    usuario$
      .pipe(
        /*
         * Al cambiar la sesión se cancelan las consultas
         * anteriores y se eliminan sus datos.
         */
        switchMap((idUsuario) => {
          this.estadoSubject.next(
            this.crearEstadoInicial(
              idUsuario,
            ),
          );

          if (!idUsuario) {
            return EMPTY;
          }

          const eventosSocket$ =
            this.socket.eventos$.pipe(
              filter(
                (evento) =>
                  evento.id_usuario ===
                  idUsuario,
              ),
              map(() => undefined),
            );

          const reconexiones$ =
            this.socket.sincronizar$.pipe(
              filter(
                (evento) =>
                  evento.id_usuario ===
                  idUsuario,
              ),
              map(() => undefined),
            );

          return merge(
            // Primera consulta después de iniciar sesión.
            of(undefined),

            // Actualización solicitada por los componentes.
            this.actualizarSubject,

            // Nueva notificación, lectura o archivo.
            eventosSocket$,

            // Recuperación después de conectar o reconectar.
            reconexiones$,
          ).pipe(
            /*
             * Agrupa eventos próximos para evitar consultar
             * varias veces por una misma operación.
             */
            debounceTime(200),

            /*
             * Una actualización nueva reemplaza la consulta
             * anterior, evitando publicar respuestas atrasadas.
             */
            switchMap(() =>
              this.consultarEstado(
                idUsuario,
              ),
            ),
          );
        }),

        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe((estado) => {
        this.estadoSubject.next(
          estado,
        );
      });

    this.destroyRef.onDestroy(() => {
      this.actualizarSubject.complete();
      this.estadoSubject.complete();
    });
  }

  // =========================================================
  // 2. SOLICITAR ACTUALIZACIÓN MANUAL
  // =========================================================

  /**
   * Llamar después de marcar como leída, leer todas
   * o archivar una notificación desde REST.
   */
  actualizar(): void {
    this.iniciar();

    if (
      !this.browser ||
      !this.auth.getCurrentUser()
    ) {
      return;
    }

    this.actualizarSubject.next();
  }

  // =========================================================
  // 3. CONSULTAR ESTADO ACTUAL
  // =========================================================

  getSnapshot(): NotificacionesEstado {
    const estado =
      this.estadoSubject.value;

    return {
      ...estado,

      avisosRecientes: [
        ...estado.avisosRecientes,
      ],
    };
  }

  // =========================================================
  // 4. CONSULTAR CONTADOR Y RECIENTES POR REST
  // =========================================================

  private consultarEstado(
    idUsuario: string,
  ): Observable<NotificacionesEstado> {
    return defer(() => {
      this.estadoSubject.next({
        ...this.estadoSubject.value,

        isLoading: true,
        errorMessage: null,
      });

      /*
       * Tus servicios agregan el JWT manualmente.
       * Este método de AuthService permite obtener uno vigente
       * antes de ejecutar ambas peticiones.
       */
      return from(
        this.auth.getAccessTokenForSocket(),
      ).pipe(
        switchMap((token) => {
          if (!token) {
            throw new Error(
              'No hay una sesión disponible para consultar las notificaciones.',
            );
          }

          return forkJoin({
            contador: this.resolverConsulta(
              this.api.getTotalNoLeidas(),

              'No se pudo actualizar el contador.',
            ),

            recientes: this.resolverConsulta(
              this.api.getMisNotificaciones({
                page: 1,

                limit:
                  this.limiteRecientes,

                archivada: false,
              }),

              'No se pudieron actualizar los avisos recientes.',
            ),
          });
        }),

        map(
          ({
            contador,
            recientes,
          }): NotificacionesEstado => {
            const anterior =
              this.estadoSubject.value;

            const errores = [
              contador.error,
              recientes.error,
            ].filter(
              (mensaje): mensaje is string =>
                mensaje !== null,
            );

            /*
             * Si falla una consulta, conservamos su último
             * resultado y actualizamos la que sí respondió.
             */
            return {
              idUsuario,

              totalNoLeidas:
                contador.data !== null
                  ? contador.data.total_no_leidas
                  : anterior.totalNoLeidas,

              avisosRecientes:
                recientes.data !== null
                  ? [
                    ...recientes.data.items,
                  ]
                  : anterior.avisosRecientes,

              isLoading: false,

              errorMessage:
                errores.length > 0
                  ? errores.join(' ')
                  : null,

              ultimaSincronizacion:
                errores.length === 0
                  ? new Date().toISOString()
                  : anterior.ultimaSincronizacion,
            };
          },
        ),

        /*
         * Captura errores de renovación o preparación.
         * El flujo principal permanece activo para reintentar.
         */
        catchError((error: unknown) =>
          of({
            ...this.estadoSubject.value,

            idUsuario,

            isLoading: false,

            errorMessage:
              this.obtenerMensajeError(
                error,
                'No se pudieron actualizar las notificaciones.',
              ),
          }),
        ),
      );
    });
  }

  // =========================================================
  // 5. RESOLVER UNA CONSULTA INDEPENDIENTE
  // =========================================================

  private resolverConsulta<T>(
    consulta: Observable<ApiResponse<T>>,
    mensajeError: string,
  ): Observable<ResultadoConsulta<T>> {
    return consulta.pipe(
      map(
        (
          respuesta,
        ): ResultadoConsulta<T> => {
          if (
            !respuesta.success ||
            respuesta.data == null
          ) {
            throw new Error(
              respuesta.message ||
              mensajeError,
            );
          }

          return {
            data: respuesta.data,
            error: null,
          };
        },
      ),

      catchError((error: unknown) =>
        of<ResultadoConsulta<T>>({
          data: null,

          error:
            this.obtenerMensajeError(
              error,
              mensajeError,
            ),
        }),
      ),
    );
  }

  // =========================================================
  // 6. CREAR ESTADO INICIAL
  // =========================================================

  private crearEstadoInicial(
    idUsuario: string | null = null,
  ): NotificacionesEstado {
    return {
      idUsuario,

      totalNoLeidas: 0,
      avisosRecientes: [],

      isLoading: false,
      errorMessage: null,

      ultimaSincronizacion: null,
    };
  }

  // =========================================================
  // 7. OBTENER MENSAJE DE ERROR
  // =========================================================

  private obtenerMensajeError(
    error: unknown,
    mensajePredeterminado: string,
  ): string {
    if (typeof error === 'string') {
      return (
        error.trim() ||
        mensajePredeterminado
      );
    }

    const detalle = error as {
      message?: unknown;

      error?: {
        message?: unknown;
      };
    } | null;

    const mensaje =
      detalle?.error?.message ??
      detalle?.message;

    return (
      typeof mensaje === 'string' &&
      mensaje.trim()
    )
      ? mensaje
      : mensajePredeterminado;
  }
}
