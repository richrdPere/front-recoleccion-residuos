import { Injectable, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

// Autenticación
import { AuthService } from 'src/app/features/auth/services/auth.service';

// Socket
import { NotificacionesSocketService } from 'src/app/core/socket/notificaciones/notificaciones-socket.service';

// Estado compartido
import { NotificacionesEstadoService } from './notificaciones-estado.service';


@Injectable({
  providedIn: 'root',
})
export class NotificacionesSesionService implements OnDestroy {
  // =========================================================
  // CONTROL DEL COORDINADOR
  // =========================================================

  private iniciado = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly auth: AuthService,
    private readonly socket: NotificacionesSocketService,
    private readonly estado: NotificacionesEstadoService,
  ) { }

  // =========================================================
  // 1. INICIAR COORDINACIÓN
  // =========================================================

  iniciar(): void {
    if (this.iniciado) {
      return;
    }

    this.iniciado = true;

    /*
     * Registrar primero la sincronización REST.
     *
     * Este servicio ya escucha:
     * - Cambios de usuario.
     * - Cierre de sesión.
     * - Eventos Socket.IO.
     * - Reconexiones.
     */
    this.estado.iniciar();

    /*
     * AuthService también emite este evento antes de
     * reemplazar una sesión durante un nuevo login.
     *
     * Detenemos la conexión anterior para que no se
     * reutilice con las credenciales de otra sesión.
     */
    this.auth.sesionCerrada$
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.socket.detener();
      });

    /*
     * currentUser$ es un BehaviorSubject:
     * entrega inmediatamente el usuario restaurado
     * y vuelve a emitir al autenticar o cerrar sesión.
     */
    this.auth.currentUser$
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe((usuario) => {
        if (!usuario) {
          this.socket.detener();

          return;
        }

        /*
         * iniciar() es idempotente.
         * Si la conexión ya está activa, no la duplica.
         */
        this.socket.iniciar();
      });
  }

  // =========================================================
  // 2. DESTRUIR COORDINADOR
  // =========================================================

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.socket.detener();
  }
}
