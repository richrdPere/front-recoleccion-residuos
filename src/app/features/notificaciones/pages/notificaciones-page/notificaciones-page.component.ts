import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, Subscription, debounceTime, distinctUntilChanged, filter, finalize, from, map, merge, switchMap, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { NotificacionesService } from '../../services/notificaciones.service';
import { NotificacionesEstadoService } from '../../services/notificaciones-estado.service';

// Interfaces
import { GetMisNotificacionesParams, MiNotificacionItem } from '../../interfaces/notificaciones/get-mis-notificaciones.interface';
import { NotificacionesSocketService } from 'src/app/core/socket/notificaciones/notificaciones-socket.service';

// Components
import { NotificacionViewComponent } from '../components/notificacion-view/notificacion-view.component';

@Component({
  selector: 'app-notificaciones-page',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    NotificacionViewComponent,
  ],

  templateUrl:
    './notificaciones-page.component.html',

  styles: ``,
})
export class NotificacionesPageComponent implements OnInit, OnDestroy {
  // =========================================================
  // BANDEJA
  // =========================================================

  notificaciones: MiNotificacionItem[] = [];

  isLoading = false;
  errorMessage: string | null = null;

  totalNoLeidas = 0;

  // =========================================================
  // FILTROS
  // =========================================================

  searchBusqueda = '';

  lecturaBusqueda:
    'TODAS' | 'NO_LEIDAS' | 'LEIDAS' = 'TODAS';

  archivadaBusqueda = false;

  tipoBusqueda = '';
  prioridadBusqueda = '';

  prioridades = [
    'BAJA',
    'NORMAL',
    'ALTA',
    'URGENTE',
  ];

  searchTimeout?: ReturnType<typeof setTimeout>;

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  page = 1;
  limit = 10;

  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  // =========================================================
  // MODAL
  // =========================================================

  mostrarModalView = false;
  notificacion_id: number | null = null;

  // =========================================================
  // OPERACIONES
  // =========================================================

  readonly leyendo = new Set<number>();

  readonly archivando = new Set<number>();

  marcandoTodas = false;

  // =========================================================
  // CONTROL DE PETICIONES Y SESIÓN
  // =========================================================

  private readonly destroy$ = new Subject<void>();
  private readonly cancelarSesion$ = new Subject<void>();

  private listaSubscription?: Subscription;
  private versionLista = 0;
  private idUsuario: string | null = null;
  private destruido = false;

  constructor(
    private readonly api: NotificacionesService,
    private readonly estadoService: NotificacionesEstadoService,
    private readonly socket: NotificacionesSocketService,
    private readonly auth: AuthService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // Contador compartido con la campana.
    this.estadoService.totalNoLeidas$
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe((total) => {
        this.totalNoLeidas = total;

        this.cdr.markForCheck();
      });

    // Nueva notificación, lectura, archivo o reconexión.
    merge(
      this.socket.eventos$,
      this.socket.sincronizar$,
    )
      .pipe(
        filter(
          (evento) =>
            evento.id_usuario ===
            this.idUsuario,
        ),

        debounceTime(300),

        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        if (!this.operando) {
          this.getMisNotificaciones();
        }
      });

    // Cargar y limpiar al cambiar de usuario.
    this.auth.currentUser$
      .pipe(
        map(
          (usuario) =>
            usuario
              ? String(usuario.id_usuario)
              : null,
        ),

        distinctUntilChanged(),

        takeUntil(this.destroy$),
      )
      .subscribe((idUsuario) => {
        this.idUsuario = idUsuario;

        this.versionLista++;

        this.cancelarSesion$.next();

        this.cerrarModalInfo();

        this.notificaciones = [];

        this.totalItems = 0;
        this.totalPages = 0;

        this.page = 1;
        this.currentPage = 1;

        this.isLoading = false;
        this.errorMessage = null;

        this.leyendo.clear();
        this.archivando.clear();
        this.marcandoTodas = false;

        if (idUsuario) {
          this.getMisNotificaciones();

          this.estadoService.actualizar();
        }

        this.cdr.markForCheck();
      });
  }

  // =========================================================
  // CONSULTAR BANDEJA
  // =========================================================

  getMisNotificaciones(): void {
    if (
      !this.idUsuario ||
      this.destruido
    ) {
      return;
    }

    clearTimeout(this.searchTimeout);

    const version = ++this.versionLista;

    this.listaSubscription?.unsubscribe();

    const params: GetMisNotificacionesParams = {
      page: this.page,

      limit: this.limit,

      search:
        this.searchBusqueda.trim() || null,

      archivada:
        this.archivadaBusqueda,

      leida:
        this.lecturaBusqueda === 'TODAS'
          ? null
          : this.lecturaBusqueda === 'LEIDAS',

      tipo_notificacion:
        this.tipoBusqueda.trim() || null,

      prioridad:
        this.prioridadBusqueda || null,
    };

    this.isLoading = true;

    this.errorMessage = null;

    /*
     * Obtener un JWT vigente antes de consultar.
     * Reutiliza la renovación compartida de AuthService.
     */
    this.listaSubscription = from(
      this.auth.getAccessTokenForSocket(),
    )
      .pipe(
        switchMap((token) => {
          if (!token) {
            throw new Error(
              'No hay una sesión disponible.',
            );
          }

          return this.api.getMisNotificaciones(
            params,
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

        takeUntil(this.cancelarSesion$),

        takeUntil(this.destroy$),

        finalize(() => {
          if (
            version === this.versionLista &&
            !this.destruido
          ) {
            this.isLoading = false;

            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (data) => {
          if (
            version !== this.versionLista
          ) {
            return;
          }

          /*
           * Si se archivó el último elemento de una página,
           * regresar a la última página disponible.
           */
          if (
            data.total_pages > 0 &&
            data.page > data.total_pages
          ) {
            this.page = data.total_pages;

            this.getMisNotificaciones();

            return;
          }

          this.notificaciones = data.items;

          this.totalItems = data.total;
          this.totalPages = data.total_pages;

          this.limit = data.limit;

          this.page =
            data.total === 0
              ? 1
              : data.page;

          this.currentPage = this.page;
        },

        error: (error: unknown) => {
          this.notificaciones = [];

          this.totalItems = 0;
          this.totalPages = 0;

          this.errorMessage =
            this.obtenerMensajeError(
              error,
            );
        },
      });
  }

  // =========================================================
  // FILTROS
  // =========================================================

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;

      this.getMisNotificaciones();
    }, 300);
  }

  aplicarFiltros(): void {
    this.page = 1;

    this.getMisNotificaciones();
  }

  limpiarFiltros(): void {
    this.searchBusqueda = '';
    this.lecturaBusqueda = 'TODAS';

    this.archivadaBusqueda = false;

    this.tipoBusqueda = '';
    this.prioridadBusqueda = '';

    this.aplicarFiltros();
  }

  get hayFiltros(): boolean {
    return Boolean(
      this.searchBusqueda.trim() ||
      this.lecturaBusqueda !== 'TODAS' ||
      this.archivadaBusqueda ||
      this.tipoBusqueda.trim() ||
      this.prioridadBusqueda,
    );
  }

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  cambiarPagina(
    nuevaPagina: number,
  ): void {
    if (
      this.isLoading ||
      this.operando ||
      nuevaPagina < 1 ||
      nuevaPagina > this.totalPages ||
      nuevaPagina === this.page
    ) {
      return;
    }

    this.page = nuevaPagina;

    this.getMisNotificaciones();
  }

  cambiarLimite(): void {
    this.page = 1;

    this.getMisNotificaciones();
  }

  get desde(): number {
    return this.totalItems === 0
      ? 0
      : (this.currentPage - 1) *
      this.limit + 1;
  }

  get hasta(): number {
    return Math.min(
      this.currentPage * this.limit,
      this.totalItems,
    );
  }

  // =========================================================
  // DETALLE
  // =========================================================

  verNotificacion(
    item: MiNotificacionItem,
  ): void {
    this.notificacion_id =
      item.id_notificacion_usuario;

    this.mostrarModalView = true;
  }

  cerrarModalInfo(): void {
    this.mostrarModalView = false;

    this.notificacion_id = null;
  }

  onNotificacionActualizada(): void {
    this.estadoService.actualizar();

    this.getMisNotificaciones();
  }

  // =========================================================
  // LECTURA Y ARCHIVO
  // =========================================================

  marcarLeida(
    item: MiNotificacionItem,
  ): void {
    if (
      item.leida ||
      this.operando
    ) {
      return;
    }

    this.ejecutarAccion(
      'LEER',

      item.id_notificacion_usuario,

      this.api.marcarNotificacionLeida(
        item.id_notificacion_usuario,
      ),
    );
  }

  archivar(
    item: MiNotificacionItem,
  ): void {
    if (
      item.archivada ||
      this.operando
    ) {
      return;
    }

    this.ejecutarAccion(
      'ARCHIVAR',

      item.id_notificacion_usuario,

      this.api.archivarNotificacion(
        item.id_notificacion_usuario,
      ),
    );
  }

  marcarTodasLeidas(): void {
    if (
      this.operando ||
      this.totalNoLeidas === 0
    ) {
      return;
    }

    this.ejecutarAccion(
      'TODAS',

      null,

      this.api.marcarTodasNotificacionesLeidas(),
    );
  }

  private ejecutarAccion(
    tipo: 'LEER' | 'ARCHIVAR' | 'TODAS',

    id: number | null,

    peticion: Observable<{
      success: boolean;
      message: string;
    }>,
  ): void {
    const usuario = this.idUsuario;

    if (!usuario) {
      return;
    }

    if (tipo === 'LEER' && id !== null) {
      this.leyendo.add(id);
    }

    if (
      tipo === 'ARCHIVAR' &&
      id !== null
    ) {
      this.archivando.add(id);
    }

    if (tipo === 'TODAS') {
      this.marcandoTodas = true;
    }

    peticion
      .pipe(
        map((respuesta) => {
          if (!respuesta.success) {
            throw new Error(
              respuesta.message,
            );
          }

          return respuesta;
        }),

        takeUntil(this.cancelarSesion$),

        takeUntil(this.destroy$),

        finalize(() => {
          if (
            this.destruido ||
            usuario !== this.idUsuario
          ) {
            return;
          }

          if (id !== null) {
            this.leyendo.delete(id);
            this.archivando.delete(id);
          }

          this.marcandoTodas = false;

          /*
           * Consultar REST aunque no llegue el evento Socket.
           * También verifica el estado ante un fallo de red.
           */
          this.estadoService.actualizar();

          this.getMisNotificaciones();

          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        error: (error: unknown) => {
          void Swal.fire({
            icon: 'error',

            title:
              'No se pudo completar la operación',

            text:
              this.obtenerMensajeError(
                error,
              ),
          });
        },
      });
  }

  get operando(): boolean {
    return (
      this.marcandoTodas ||
      this.leyendo.size > 0 ||
      this.archivando.size > 0
    );
  }

  // =========================================================
  // UTILIDADES
  // =========================================================

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
      'Intenta nuevamente.'
    );
  }

  ngOnDestroy(): void {
    this.destruido = true;

    clearTimeout(this.searchTimeout);

    this.cancelarSesion$.next();
    this.cancelarSesion$.complete();

    this.destroy$.next();
    this.destroy$.complete();
  }
}
