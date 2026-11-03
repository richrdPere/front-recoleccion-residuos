import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Services
import { NotificacionesEstado, NotificacionesEstadoService } from '../../services/notificaciones-estado.service';
import { NotificacionesService } from '../../services/notificaciones.service';

// Interfaces
import { MiNotificacionItem } from '../../interfaces/notificaciones/get-mis-notificaciones.interface';

@Component({
  selector: 'app-notificaciones-campana',
  imports: [DatePipe],
  templateUrl: './notificaciones-campana.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionesCampanaComponent {

  // =========================================================
  // DEPENDENCIAS
  // =========================================================
  private readonly estadoService = inject(NotificacionesEstadoService);

  private readonly api = inject(NotificacionesService);

  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  // =========================================================
  // ESTADO DEL COMPONENTE
  // =========================================================
  estado: NotificacionesEstado = this.estadoService.getSnapshot();

  abierto = false;

  seleccionada: MiNotificacionItem | null = null;

  marcandoLectura = false;

  errorLectura: string | null = null;

  private versionLectura = 0;

  // =========================================================
  // INICIALIZACIÓN
  // =========================================================

  ngOnInit(): void {
    this.estadoService.estado$
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe((estado) => {
        // Limpiar la vista si cambia la cuenta o se cierra sesión.
        if (
          estado.idUsuario !==
          this.estado.idUsuario
        ) {
          this.versionLectura++;

          this.abierto = false;
          this.seleccionada = null;
          this.marcandoLectura = false;
          this.errorLectura = null;
        }

        this.estado = estado;

        /*
         * Sincronizar el mensaje abierto si aparece actualizado
         * entre los avisos recientes.
         */
        const seleccionada =
          this.seleccionada;

        if (seleccionada) {
          const actualizada =
            estado.avisosRecientes.find(
              (item) =>
                String(
                  item.id_notificacion_usuario,
                ) ===
                String(
                  seleccionada.id_notificacion_usuario,
                ),
            );

          if (actualizada) {
            this.seleccionada =
              actualizada;
          }
        }

        this.cdr.markForCheck();
      });
  }

  // =========================================================
  // ABRIR / CERRAR CAMPANA
  // =========================================================

  alternar(): void {
    this.abierto = !this.abierto;

    if (this.abierto) {
      this.estadoService.actualizar();
    }
  }

  actualizar(): void {
    this.estadoService.actualizar();
  }

  // =========================================================
  // MOSTRAR MENSAJE COMPLETO
  // =========================================================

  abrirAviso(
    item: MiNotificacionItem,
  ): void {
    this.abierto = false;

    this.seleccionada = item;

    this.errorLectura = null;
    this.marcandoLectura = false;

    // Invalida respuestas de una selección anterior.
    this.versionLectura++;

    if (!item.leida) {
      this.marcarSeleccionadaComoLeida();
    }
  }

  cerrarDetalle(): void {
    this.versionLectura++;

    this.seleccionada = null;
    this.errorLectura = null;
    this.marcandoLectura = false;
  }

  // =========================================================
  // MARCAR COMO LEÍDA
  // =========================================================

  marcarSeleccionadaComoLeida(): void {
    const item = this.seleccionada;

    const idUsuario =
      this.estado.idUsuario;

    if (
      !item ||
      item.leida ||
      !idUsuario ||
      this.marcandoLectura
    ) {
      return;
    }

    const version =
      ++this.versionLectura;

    this.marcandoLectura = true;
    this.errorLectura = null;

    this.api
      .marcarNotificacionLeida(
        item.id_notificacion_usuario,
      )
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({
        next: (respuesta) => {
          /*
           * Actualizar el estado compartido aunque el usuario
           * haya cerrado el mensaje durante la petición.
           */
          if (
            this.estado.idUsuario ===
            idUsuario
          ) {
            this.estadoService.actualizar();
          }

          if (
            version !==
            this.versionLectura ||
            this.estado.idUsuario !==
            idUsuario
          ) {
            return;
          }

          this.marcandoLectura = false;

          if (!respuesta.success) {
            this.errorLectura =
              respuesta.message ||
              'No se pudo confirmar la lectura.';

            this.cdr.markForCheck();

            return;
          }

          this.seleccionada = {
            ...item,

            leida: true,

            fecha_leida:
              respuesta.data.fecha_leida,
          };

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {
          if (
            version !==
            this.versionLectura ||
            this.estado.idUsuario !==
            idUsuario
          ) {
            return;
          }

          this.marcandoLectura = false;

          const detalle = error as {
            message?: string;

            error?: {
              message?: string;
            };
          } | null;

          this.errorLectura =
            detalle?.error?.message ||
            detalle?.message ||
            'No se pudo confirmar la lectura.';

          this.cdr.markForCheck();
        },
      });
  }

  // =========================================================
  // NAVEGACIÓN
  // =========================================================

  verTodas(): void {
    this.abierto = false;

    this.cerrarDetalle();

    void this.router.navigateByUrl(
      '/admin/notificaciones',
    );
  }

  // =========================================================
  // CERRAR CON CLIC EXTERIOR O ESCAPE
  // =========================================================

  @HostListener(
    'document:click',
    ['$event'],
  )
  cerrarAlHacerClicFuera(
    event: MouseEvent,
  ): void {
    const target =
      event.target as Node | null;

    if (
      this.abierto &&
      target &&
      !this.elementRef.nativeElement.contains(
        target,
      )
    ) {
      this.abierto = false;
    }
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    this.abierto = false;

    this.cerrarDetalle();
  }
}
