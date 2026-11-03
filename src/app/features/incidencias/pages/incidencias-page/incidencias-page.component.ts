import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, firstValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Service
import { IncidenciasService } from '../../services/incidencias.service';

// Interfaces
import { IncidenciaId, IncidenciaTipo, IncidenciaPrioridad, IncidenciaOrigen, IncidenciaEstado, IncidenciaListadoItem, IncidenciaDetalleData, IncidenciasPaginadasFilters, IncidenciasSortBy, IncidenciasSortOrder, ChangeIncidenciaHabilitacionResponse, DeleteIncidenciaResponse } from '../../interfaces';

@Component({
  selector: 'app-incidencias-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    UppercaseDirective,
  ],
  templateUrl: './incidencias-page.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenciasPageComponent implements OnInit, OnDestroy {

  // *********************************************************
  // INCIDENCIAS
  // *********************************************************

  incidencias: IncidenciaListadoItem[] = [];
  incidencia_id: IncidenciaId | null = null;
  incidenciaSeleccionada: IncidenciaListadoItem | null = null;

  isLoading = true;
  errorListado: string | null = null;

  // *********************************************************
  // MODALES
  // *********************************************************
  mostrarModalView = false;
  mostrarModalResponsable = false;
  mostrarModalEstado = false;

  // *********************************************************
  // BÚSQUEDA
  // *********************************************************

  searchBusqueda = '';

  private searchTimeout:
    ReturnType<typeof setTimeout> | undefined;

  // *********************************************************
  // FILTROS
  // *********************************************************

  filtroTipo: IncidenciaTipo | '' = '';
  filtroPrioridad: IncidenciaPrioridad | '' = '';
  filtroOrigen: IncidenciaOrigen | '' = '';
  filtroEstadoIncidencia: IncidenciaEstado | '' = '';

  // Se usan cadenas en el selector para distinguir:
  // todas, habilitadas y deshabilitadas.
  filtroHabilitacion: '' | 'true' | 'false' = '';

  filtroUsuarioReporte: IncidenciaId | '' = '';
  filtroResponsable: IncidenciaId | '' = '';
  filtroRecorrido: IncidenciaId | '' = '';
  filtroZona: IncidenciaId | '' = '';
  filtroRuta: IncidenciaId | '' = '';

  fechaDesde = '';
  fechaHasta = '';

  // *********************************************************
  // ORDENAMIENTO
  // *********************************************************

  sortBy: IncidenciasSortBy = 'fecha_reporte';
  sortOrder: IncidenciasSortOrder = 'DESC';

  // *********************************************************
  // PAGINACIÓN
  // *********************************************************

  page = 1;
  limit = 5;

  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  readonly pageSizeOptions = [5, 10, 20, 50];

  // *********************************************************
  // OPERACIONES EN CURSO
  // *********************************************************

  readonly incidenciasCambiandoEstado = new Set<string>();
  readonly incidenciasEliminando = new Set<string>();

  // *********************************************************
  // OPCIONES DE SELECTORES
  // *********************************************************

  readonly tiposIncidencia: IncidenciaTipo[] = [
    'VIA_BLOQUEADA',
    'AVERIA_VEHICULO',
    'ACCIDENTE',
    'RECOLECCION_NO_REALIZADA',
    'ACUMULACION_RESIDUOS',
    'PUNTO_INACCESIBLE',
    'OTRO',
  ];

  readonly prioridades: IncidenciaPrioridad[] = [
    'BAJA',
    'MEDIA',
    'ALTA',
    'CRITICA',
  ];

  readonly estadosIncidencia: IncidenciaEstado[] = [
    'REPORTADA',
    'EN_REVISION',
    'EN_ATENCION',
    'RESUELTA',
    'RECHAZADA',
    'CANCELADA',
  ];

  readonly origenes: IncidenciaOrigen[] = [
    'APP_OPERATIVA',
    'APP_CIUDADANA',
    'WEB_MUNICIPAL',
    'WEB_CIUDADANA',
  ];

  // *********************************************************
  // CONTROL DE SUSCRIPCIONES
  // *********************************************************

  private readonly destroy$ = new Subject<void>();

  private listadoSubscription?: Subscription;
  private destruido = false;

  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.getIncidenciasPaginated();
  }

  ngOnDestroy(): void {
    this.destruido = true;

    clearTimeout(this.searchTimeout);

    this.destroy$.next();
    this.destroy$.complete();

    this.listadoSubscription?.unsubscribe();
  }

  // *********************************************************
  // 1. OBTENER INCIDENCIAS PAGINADAS
  // *********************************************************

  getIncidenciasPaginated(): void {
    if (this.destruido) {
      return;
    }

    clearTimeout(this.searchTimeout);

    if (
      this.fechaDesde &&
      this.fechaHasta &&
      this.fechaDesde > this.fechaHasta
    ) {
      void Swal.fire({
        icon: 'warning',
        title: 'Rango de fechas inválido',
        text:
          'La fecha inicial no puede ser posterior a la fecha final.',
      });

      return;
    }

    // Cancela la consulta anterior para evitar que una
    // respuesta antigua reemplace los filtros actuales.
    this.listadoSubscription?.unsubscribe();

    const params = this.obtenerFiltros();

    this.isLoading = true;
    this.errorListado = null;

    this.actualizarVista();

    this.listadoSubscription = this.incidenciasService
      .getIncidenciasPaginated(params)
      .pipe(
        takeUntil(this.destroy$),

        finalize(() => {
          this.isLoading = false;
          this.actualizarVista();
        }),
      )
      .subscribe({
        next: (res) => {
          if (!res.success || !res.data) {
            this.limpiarResultados();

            this.errorListado =
              res.message ||
              'No se pudieron obtener las incidencias.';

            return;
          }

          const {
            items,
            pagination,
          } = res.data;

          this.incidencias = items;

          this.totalItems = pagination.total;
          this.totalPages = pagination.total_pages;

          this.page = pagination.page;
          this.currentPage = pagination.page;
          this.limit = pagination.limit;
        },

        error: (error: unknown) => {
          console.error(
            '[getIncidenciasPaginated]',
            error,
          );

          this.limpiarResultados();

          this.errorListado = this.obtenerMensajeError(
            error,
            'No se pudieron obtener las incidencias.',
          );
        },
      });
  }

  // *********************************************************
  // 2. CONSTRUIR FILTROS
  // *********************************************************

  private obtenerFiltros(): IncidenciasPaginadasFilters {
    const filters: IncidenciasPaginadasFilters = {
      page: this.page,
      limit: this.limit,
      sort_by: this.sortBy,
      sort_order: this.sortOrder,
    };

    const search = this.searchBusqueda.trim();

    if (search) {
      filters.search = search;
    }

    if (this.filtroTipo) {
      filters.tipo = this.filtroTipo;
    }

    if (this.filtroPrioridad) {
      filters.prioridad = this.filtroPrioridad;
    }

    if (this.filtroOrigen) {
      filters.origen = this.filtroOrigen;
    }

    if (this.filtroEstadoIncidencia) {
      filters.estado_incidencia =
        this.filtroEstadoIncidencia;
    }

    // Conserva correctamente estado: false.
    if (this.filtroHabilitacion !== '') {
      filters.estado =
        this.filtroHabilitacion === 'true';
    }

    if (this.filtroUsuarioReporte !== '') {
      filters.id_usuario_reporte =
        this.filtroUsuarioReporte;
    }

    if (this.filtroResponsable !== '') {
      filters.id_responsable =
        this.filtroResponsable;
    }

    if (this.filtroRecorrido !== '') {
      filters.id_recorrido =
        this.filtroRecorrido;
    }

    if (this.filtroZona !== '') {
      filters.id_zona = this.filtroZona;
    }

    if (this.filtroRuta !== '') {
      filters.id_ruta = this.filtroRuta;
    }

    if (this.fechaDesde) {
      filters.fecha_desde = this.fechaDesde;
    }

    if (this.fechaHasta) {
      filters.fecha_hasta = this.fechaHasta;
    }

    return filters;
  }

  // *********************************************************
  // 3. ELIMINAR INCIDENCIA
  // *********************************************************

  async eliminarIncidencia(
    incidencia: IncidenciaListadoItem,
  ): Promise<void> {
    if (
      this.destruido ||
      this.estaProcesando(incidencia)
    ) {
      return;
    }

    const id = String(incidencia.id_incidencia);

    this.incidenciasEliminando.add(id);
    this.actualizarVista();

    try {
      const resultado = await Swal.fire<
        DeleteIncidenciaResponse
      >({
        icon: 'warning',
        title: '¿Eliminar incidencia?',
        text:
          `Se eliminará la incidencia N.° ${id}.`,

        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',

        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#3085d6',

        reverseButtons: true,
        focusCancel: true,
        showLoaderOnConfirm: true,

        allowOutsideClick: () => !Swal.isLoading(),
        allowEscapeKey: () => !Swal.isLoading(),

        preConfirm: async () => {
          try {
            const response = await firstValueFrom(
              this.incidenciasService
                .deleteIncidencia(
                  incidencia.id_incidencia,
                )
                .pipe(
                  takeUntil(this.destroy$),
                ),
            );

            if (
              !response.success ||
              !response.data?.eliminado
            ) {
              Swal.showValidationMessage(
                response.message ||
                'No se pudo eliminar la incidencia.',
              );

              return false;
            }

            return response;
          } catch (error: unknown) {
            if (!this.destruido) {
              Swal.showValidationMessage(
                this.obtenerMensajeError(
                  error,
                  'No se pudo eliminar la incidencia.',
                ),
              );
            }

            return false;
          }
        },
      });

      if (
        this.destruido ||
        !resultado.isConfirmed ||
        !resultado.value
      ) {
        return;
      }

      // Si eliminamos el último registro de esta página,
      // retrocedemos antes de consultar nuevamente.
      if (
        this.incidencias.length === 1 &&
        this.page > 1
      ) {
        this.page -= 1;
      }

      this.getIncidenciasPaginated();

      void Swal.fire({
        icon: 'success',
        title: 'Incidencia eliminada',
        text: resultado.value.message,
        timer: 1800,
        showConfirmButton: false,
      });
    } finally {
      this.incidenciasEliminando.delete(id);
      this.actualizarVista();
    }
  }

  // *********************************************************
  // 4. CAMBIAR HABILITACIÓN ADMINISTRATIVA
  // *********************************************************

  async cambiarHabilitacion(
    incidencia: IncidenciaListadoItem,
    event: Event,
  ): Promise<void> {
    const input = event.target as HTMLInputElement;

    // Restauramos el checkbox hasta confirmar con el backend.
    input.checked = incidencia.estado;

    if (
      this.destruido ||
      this.estaProcesando(incidencia)
    ) {
      return;
    }

    const id = String(incidencia.id_incidencia);
    const nuevoEstado = !incidencia.estado;

    this.incidenciasCambiandoEstado.add(id);
    this.actualizarVista();

    try {
      const resultado = await Swal.fire<
        ChangeIncidenciaHabilitacionResponse
      >({
        icon: 'warning',

        title: nuevoEstado
          ? '¿Habilitar incidencia?'
          : '¿Deshabilitar incidencia?',

        text: nuevoEstado
          ? `Se habilitará la incidencia N.° ${id}.`
          : `Se deshabilitará la incidencia N.° ${id}.`,

        showCancelButton: true,

        confirmButtonText: nuevoEstado
          ? 'Sí, habilitar'
          : 'Sí, deshabilitar',

        cancelButtonText: 'Cancelar',

        confirmButtonColor: nuevoEstado
          ? '#16a34a'
          : '#dc2626',

        reverseButtons: true,
        focusCancel: true,
        showLoaderOnConfirm: true,

        allowOutsideClick: () => !Swal.isLoading(),
        allowEscapeKey: () => !Swal.isLoading(),

        preConfirm: async () => {
          try {
            const response = await firstValueFrom(
              this.incidenciasService
                .changeIncidenciaHabilitacion(
                  incidencia.id_incidencia,
                  { estado: nuevoEstado },
                )
                .pipe(
                  takeUntil(this.destroy$),
                ),
            );

            if (!response.success || !response.data) {
              Swal.showValidationMessage(
                response.message ||
                'No se pudo actualizar la habilitación.',
              );

              return false;
            }

            return response;
          } catch (error: unknown) {
            if (!this.destruido) {
              Swal.showValidationMessage(
                this.obtenerMensajeError(
                  error,
                  'No se pudo actualizar la habilitación de la incidencia.',
                ),
              );
            }

            return false;
          }
        },
      });

      if (
        this.destruido ||
        !resultado.isConfirmed ||
        !resultado.value
      ) {
        return;
      }

      const actualizada = resultado.value.data;

      incidencia.estado = actualizada.estado;
      incidencia.updated_at = actualizada.updated_at;

      input.checked = actualizada.estado;

      // Recargamos para respetar filtros y ordenamiento.
      this.getIncidenciasPaginated();

      void Swal.fire({
        icon: 'success',

        title: actualizada.estado
          ? 'Incidencia habilitada'
          : 'Incidencia deshabilitada',

        text: resultado.value.message,
        timer: 1800,
        showConfirmButton: false,
      });
    } finally {
      this.incidenciasCambiandoEstado.delete(id);
      this.actualizarVista();
    }
  }

  // *********************************************************
  // CONTROL DE OPERACIONES
  // *********************************************************

  estaCambiandoEstado(
    incidencia: IncidenciaListadoItem,
  ): boolean {
    return this.incidenciasCambiandoEstado.has(
      String(incidencia.id_incidencia),
    );
  }

  estaEliminando(
    incidencia: IncidenciaListadoItem,
  ): boolean {
    return this.incidenciasEliminando.has(
      String(incidencia.id_incidencia),
    );
  }

  estaProcesando(
    incidencia: IncidenciaListadoItem,
  ): boolean {
    return (
      this.estaCambiandoEstado(incidencia) ||
      this.estaEliminando(incidencia)
    );
  }

  // *********************************************************
  // FILTROS Y BÚSQUEDA
  // *********************************************************

  get hayFiltros(): boolean {
    return Boolean(
      this.searchBusqueda.trim() ||
      this.filtroTipo ||
      this.filtroPrioridad ||
      this.filtroOrigen ||
      this.filtroEstadoIncidencia ||
      this.filtroHabilitacion !== '' ||
      this.filtroUsuarioReporte !== '' ||
      this.filtroResponsable !== '' ||
      this.filtroRecorrido !== '' ||
      this.filtroZona !== '' ||
      this.filtroRuta !== '' ||
      this.fechaDesde ||
      this.fechaHasta
    );
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.currentPage = 1;

      this.getIncidenciasPaginated();
    }, 300);
  }

  onFiltroChange(): void {
    this.page = 1;
    this.currentPage = 1;

    this.getIncidenciasPaginated();
  }

  limpiarFiltros(): void {
    clearTimeout(this.searchTimeout);

    this.searchBusqueda = '';

    this.filtroTipo = '';
    this.filtroPrioridad = '';
    this.filtroOrigen = '';
    this.filtroEstadoIncidencia = '';
    this.filtroHabilitacion = '';

    this.filtroUsuarioReporte = '';
    this.filtroResponsable = '';
    this.filtroRecorrido = '';
    this.filtroZona = '';
    this.filtroRuta = '';

    this.fechaDesde = '';
    this.fechaHasta = '';

    this.sortBy = 'fecha_reporte';
    this.sortOrder = 'DESC';

    this.page = 1;
    this.currentPage = 1;

    this.getIncidenciasPaginated();
  }

  // *********************************************************
  // PAGINACIÓN
  // *********************************************************

  cambiarPagina(nuevaPagina: number): void {
    if (
      nuevaPagina < 1 ||
      nuevaPagina > this.totalPages ||
      nuevaPagina === this.page
    ) {
      return;
    }

    this.page = nuevaPagina;
    this.getIncidenciasPaginated();
  }

  cambiarLimite(): void {
    this.limit = Number(this.limit);

    this.page = 1;
    this.currentPage = 1;

    this.getIncidenciasPaginated();
  }

  onPageSizeChange(): void {
    this.cambiarLimite();
  }

  get inicioRegistro(): number {
    if (this.incidencias.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.limit + 1;
  }

  get finRegistro(): number {
    if (this.incidencias.length === 0) {
      return 0;
    }

    return Math.min(
      this.inicioRegistro + this.incidencias.length - 1,
      this.totalItems,
    );
  }

  // *********************************************************
  // MODAL: DETALLE
  // *********************************************************

  verIncidencia(
    incidencia: IncidenciaListadoItem,
  ): void {
    this.incidencia_id = incidencia.id_incidencia;
    this.mostrarModalView = true;
  }

  cerrarModalInfo(): void {
    this.mostrarModalView = false;
    this.incidencia_id = null;
  }

  // *********************************************************
  // MODAL: RESPONSABLE
  // *********************************************************

  abrirModalResponsable(
    incidencia: IncidenciaListadoItem,
  ): void {
    this.incidenciaSeleccionada = {
      ...incidencia,
    };

    this.mostrarModalResponsable = true;
  }

  cerrarModalResponsable(): void {
    this.mostrarModalResponsable = false;

    if (!this.mostrarModalEstado) {
      this.incidenciaSeleccionada = null;
    }
  }

  // *********************************************************
  // MODAL: ESTADO DE ATENCIÓN
  // *********************************************************

  abrirModalEstado(
    incidencia: IncidenciaListadoItem,
  ): void {
    this.incidenciaSeleccionada = {
      ...incidencia,
    };

    this.mostrarModalEstado = true;
  }

  cerrarModalEstado(): void {
    this.mostrarModalEstado = false;

    if (!this.mostrarModalResponsable) {
      this.incidenciaSeleccionada = null;
    }
  }

  // *********************************************************
  // EVENTO DE GUARDADO DE LOS SUBCOMPONENTES
  // *********************************************************

  onIncidenciaActualizada(
    incidencia?: IncidenciaDetalleData,
  ): void {
    if (incidencia) {
      const registro = this.incidencias.find(
        (item) =>
          String(item.id_incidencia) ===
          String(incidencia.id_incidencia),
      );

      if (registro) {
        Object.assign(registro, incidencia);
      }
    }

    this.mostrarModalResponsable = false;
    this.mostrarModalEstado = false;
    this.incidenciaSeleccionada = null;

    this.getIncidenciasPaginated();
  }

  // *********************************************************
  // HELPERS PRIVADOS
  // *********************************************************

  private limpiarResultados(): void {
    this.incidencias = [];
    this.totalItems = 0;
    this.totalPages = 0;
  }

  private actualizarVista(): void {
    if (!this.destruido) {
      this.cdr.markForCheck();
    }
  }

  private obtenerMensajeError(
    error: unknown,
    mensajePorDefecto: string,
  ): string {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    const err = error as {
      error?: {
        message?: unknown;
      } | string;
      message?: unknown;
    } | null;

    const mensajeBackend =
      typeof err?.error === 'string'
        ? err.error
        : err?.error?.message;

    if (
      typeof mensajeBackend === 'string' &&
      mensajeBackend.trim()
    ) {
      return mensajeBackend;
    }

    if (
      typeof err?.message === 'string' &&
      err.message.trim()
    ) {
      return err.message;
    }

    return mensajePorDefecto;
  }
}
