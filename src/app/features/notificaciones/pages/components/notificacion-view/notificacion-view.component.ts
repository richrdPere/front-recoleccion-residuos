import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, finalize, from, map, switchMap, takeUntil } from 'rxjs';

// Services
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { NotificacionesService } from '../../../services/notificaciones.service';

// Interfaces
import { NotificacionByIdData } from '../../../interfaces/notificaciones/get-notificacion-by-id.interface';

@Component({
  selector: 'notificacion-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificacion-view.component.html',
  styles: ``,

})
export class NotificacionViewComponent
  implements OnInit, OnDestroy {
  @Input({
    required: true,
  })
  notificacion_id!: number;

  @Output()
  modalCerrado =
    new EventEmitter<void>();

  @Output()
  notificacionActualizada =
    new EventEmitter<void>();

  notificacion:
    NotificacionByIdData | null = null;

  isLoading = false;

  isReading = false;
  isArchiving = false;

  errorMessage: string | null = null;

  errorAccion: string | null = null;

  private readonly destroy$ =
    new Subject<void>();

  private readonly cancelar$ =
    new Subject<void>();

  private idUsuario: string | null = null;

  private activo = true;

  constructor(
    private readonly api:
      NotificacionesService,

    private readonly auth: AuthService,

    private readonly cdr:
      ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const usuario =
      this.auth.getCurrentUser();

    this.idUsuario =
      usuario
        ? String(usuario.id_usuario)
        : null;

    if (!this.idUsuario) {
      this.cerrar();

      return;
    }

    this.auth.currentUser$
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe((actual) => {
        const id =
          actual
            ? String(actual.id_usuario)
            : null;

        if (id !== this.idUsuario) {
          this.cerrar();
        }
      });

    if (this.activo) {
      this.getNotificacion();
    }
  }

  // =========================================================
  // DETALLE
  // =========================================================

  getNotificacion(): void {
    if (
      !this.activo ||
      this.isLoading
    ) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    from(
      this.auth.getAccessTokenForSocket(),
    )
      .pipe(
        switchMap((token) => {
          if (!token) {
            throw new Error(
              'No hay una sesión disponible.',
            );
          }

          return this.api.getNotificacionById(
            this.notificacion_id,
          );
        }),

        map((respuesta) => {
          if (!respuesta.success) {
            throw new Error(
              respuesta.message,
            );
          }

          return respuesta.data;
        }),

        takeUntil(this.cancelar$),

        takeUntil(this.destroy$),

        finalize(() => {
          this.isLoading = false;

          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (data) => {
          if (
            String(data.id_usuario) !==
            this.idUsuario
          ) {
            this.cerrar();

            return;
          }

          this.notificacion = data;

          if (!data.leida) {
            this.marcarLeida();
          }
        },

        error: (error: unknown) => {
          this.errorMessage =
            this.obtenerMensajeError(
              error,
            );
        },
      });
  }

  // =========================================================
  // CONFIRMAR LECTURA
  // =========================================================

  marcarLeida(): void {
    const item = this.notificacion;

    if (
      !this.activo ||
      !item ||
      item.leida ||
      this.operando
    ) {
      return;
    }

    this.isReading = true;
    this.errorAccion = null;

    this.api
      .marcarNotificacionLeida(
        item.id_notificacion_usuario,
      )
      .pipe(
        map((respuesta) => {
          if (!respuesta.success) {
            throw new Error(
              respuesta.message,
            );
          }

          return respuesta.data;
        }),

        takeUntil(this.cancelar$),

        takeUntil(this.destroy$),

        finalize(() => {
          this.isReading = false;

          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (data) => {
          this.notificacion = data;

          this.notificacionActualizada.emit();
        },

        error: (error: unknown) => {
          this.errorAccion =
            this.obtenerMensajeError(
              error,
            );
        },
      });
  }

  // =========================================================
  // ARCHIVAR
  // =========================================================

  archivar(): void {
    const item = this.notificacion;

    if (
      !this.activo ||
      !item ||
      item.archivada ||
      this.operando
    ) {
      return;
    }

    this.isArchiving = true;
    this.errorAccion = null;

    this.api
      .archivarNotificacion(
        item.id_notificacion_usuario,
      )
      .pipe(
        map((respuesta) => {
          if (!respuesta.success) {
            throw new Error(
              respuesta.message,
            );
          }

          return respuesta.data;
        }),

        takeUntil(this.cancelar$),

        takeUntil(this.destroy$),

        finalize(() => {
          this.isArchiving = false;

          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.notificacionActualizada.emit();

          this.cerrar();
        },

        error: (error: unknown) => {
          this.errorAccion =
            this.obtenerMensajeError(
              error,
            );
        },
      });
  }

  // =========================================================
  // CIERRE
  // =========================================================

  get operando(): boolean {
    return (
      this.isReading ||
      this.isArchiving
    );
  }

  cerrarDesdeInterfaz(): void {
    if (!this.operando) {
      this.cerrar();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cerrarDesdeInterfaz();
  }

  private cerrar(): void {
    if (!this.activo) {
      return;
    }

    this.activo = false;

    this.cancelar$.next();

    this.modalCerrado.emit();
  }

  private obtenerMensajeError(
    error: unknown,
  ): string {
    if (typeof error === 'string') {
      return error;
    }

    const detalle = error as {
      message?: string;

      error?: {
        message?: string;
      };
    } | null;

    return (
      detalle?.error?.message ||
      detalle?.message ||
      'No se pudo completar la operación.'
    );
  }

  ngOnDestroy(): void {
    this.activo = false;

    this.cancelar$.next();
    this.cancelar$.complete();

    this.destroy$.next();
    this.destroy$.complete();
  }
}
