import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, of, Subscription, switchMap } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Services
import { ProgramacionesService } from '../../services/programaciones.service';
import { DisponibilidadService } from '../../services/disponibilidad.service';
import { RutasServices } from '../../../rutas/services/rutas.service';

// Interfaces
import { EstadoProgramacion, ProgramacionPaginadaItem, ProgramacionPaginadaPersonalAsignado, ProgramacionPaginadaRuta, ProgramacionPaginadaVehiculo, ProgramacionesPaginadasFilters } from '../../interfaces/programaciones';
import { DisponibilidadFilters, GetVehiculosDisponiblesResponse, GetConductoresDisponiblesResponse, GetRecolectoresDisponiblesResponse } from '../../interfaces/disponibilidad';
import { RutaActivaData } from '../../../rutas/interfaces/rutas/get-rutas-activas.interface';

// Componentes
import { ProgramacionesFormComponent } from '../components/programaciones-form/programaciones-form.component';
import { ProgramacionesViewComponent } from '../components/programaciones-view/programaciones-view.component';
import { ProgramacionesPersonalComponent } from '../components/programaciones-personal/programaciones-personal.component';

@Component({
  selector: 'app-programaciones-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UppercaseDirective,
    ProgramacionesFormComponent,
    ProgramacionesViewComponent,
    ProgramacionesPersonalComponent
  ],
  templateUrl: './programaciones-page.component.html',
  styles: ``,
})
export class ProgramacionesPageComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================
  // LISTAS PARA LOS SELECTORES
  // Reciben las opciones completas, no solo las de la página.
  // ============================================================

  @Input() rutasFiltro: ProgramacionPaginadaRuta[] = [];
  @Input() vehiculosFiltro: Pick<
    ProgramacionPaginadaVehiculo,
    'id_vehiculo' | 'codigo' | 'placa'
  >[] = [];

  // ============================================================
  // EVENTOS PARA FORMULARIO Y DETALLE
  // ============================================================

  @Output() nuevaProgramacion = new EventEmitter<void>();
  @Output() editarProgramacion = new EventEmitter<ProgramacionPaginadaItem>();
  @Output() verProgramacion = new EventEmitter<number>();

  // ============================================================
  // ESTADO
  // ============================================================

  programaciones: ProgramacionPaginadaItem[] = [];

  isLoading = false;
  errorCarga: string | null = null;
  errorFiltros: string | null = null;

  readonly registrosProcesando = new Set<number>();

  private listadoSubscription?: Subscription;
  private searchTimeout?: ReturnType<typeof setTimeout>;
  private destruido = false;

  mostrarModal = false;
  modoEdicion = false;
  programacionSeleccionada: ProgramacionPaginadaItem | null = null;

  mostrarModalPersonal = false;
  programacionPersonalId: number | null = null;

  // ============================================================
  // DISPONIBILIDAD PARA EL FORMULARIO
  // ============================================================
  vehiculosDisponibles: GetVehiculosDisponiblesResponse['data'] | null = null;

  conductoresDisponibles: GetConductoresDisponiblesResponse['data'] | null = null;

  recolectoresDisponibles: GetRecolectoresDisponiblesResponse['data'] | null = null;

  rutasActivas: RutaActivaData[] = [];

  cargandoDisponibilidad = false;
  errorDisponibilidad: string | null = null;

  cargandoRutasActivas = false;
  errorRutasActivas: string | null = null;

  private disponibilidadSubscription?: Subscription;

  // ============================================================
  // FILTROS
  // ============================================================

  searchBusqueda = '';
  fechaDesdeBusqueda = '';
  fechaHastaBusqueda = '';

  estadoProgramacionBusqueda: EstadoProgramacion | '' = '';

  rutaBusqueda: number | null = null;
  vehiculoBusqueda: number | null = null;
  mostrarModalView = false;
  programacion_id: number | null = null;

  // ============================================================
  // PAGINACIÓN
  // ============================================================

  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;

  readonly pageSizeOptions = [5, 10, 20, 50];

  // ============================================================
  // SELECTORES
  // ============================================================

  readonly estadosProgramacion: {
    value: EstadoProgramacion;
    label: string;
  }[] = [
      { value: 'PROGRAMADA', label: 'PROGRAMADA' },
      { value: 'ASIGNADA', label: 'ASIGNADA' },
      { value: 'ACEPTADA', label: 'ACEPTADA' },
      { value: 'EN_CURSO', label: 'EN CURSO' },
      { value: 'PAUSADA', label: 'PAUSADA' },
      { value: 'FINALIZADA', label: 'FINALIZADA' },
      { value: 'CANCELADA', label: 'CANCELADA' },
    ];

  constructor(
    private readonly programacionesService: ProgramacionesService,
    private readonly disponibilidadService: DisponibilidadService,
    private readonly rutasService: RutasServices,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.getProgramacionesPaginated();
    this.getRutasActivas();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarBusquedaPendiente();
    this.listadoSubscription?.unsubscribe();
    this.cancelarDisponibilidad();

  }

  // ============================================================
  // LISTADO
  // ============================================================
  getProgramacionesPaginated(): void {
    this.cancelarBusquedaPendiente();
    this.listadoSubscription?.unsubscribe();

    this.errorFiltros = null;
    this.errorCarga = null;

    if (
      this.fechaDesdeBusqueda &&
      this.fechaHastaBusqueda &&
      this.fechaDesdeBusqueda > this.fechaHastaBusqueda
    ) {
      this.errorFiltros =
        'La fecha inicial no puede ser posterior a la fecha final.';
      return;
    }

    const params: ProgramacionesPaginadasFilters = {
      page: this.page,
      limit: this.limit,
      search: this.searchBusqueda.trim() || undefined,
      fecha_desde: this.fechaDesdeBusqueda || undefined,
      fecha_hasta: this.fechaHastaBusqueda || undefined,
      estado_programacion: this.estadoProgramacionBusqueda || undefined,
      id_ruta: this.rutaBusqueda ?? undefined,
      id_vehiculo: this.vehiculoBusqueda ?? undefined,
    };

    this.isLoading = true;

    this.listadoSubscription = this.programacionesService
      .getProgramacionesPaginated(params)
      .pipe(
        // Si una cancelación reduce las páginas disponibles,
        // consulta nuevamente la última página válida.
        switchMap((response) => {
          if (!response.success || !response.data) {
            return of(response);
          }

          const ultimaPagina = Math.max(
            1,
            response.data.total_pages,
          );

          if (this.page > ultimaPagina) {
            this.page = ultimaPagina;

            return this.programacionesService
              .getProgramacionesPaginated({
                ...params,
                page: ultimaPagina,
              });
          }

          return of(response);
        }),

        finalize(() => {
          this.isLoading = false;

          if (!this.destruido) {
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.limpiarListado();
            this.errorCarga =
              response.message ||
              'No se pudieron obtener las programaciones.';
            return;
          }

          const paginacion = response.data;

          this.programaciones = paginacion.items;
          this.totalItems = paginacion.total;
          this.page = paginacion.page;
          this.limit = paginacion.limit;
          this.totalPages = paginacion.total_pages;
        },

        error: (error: unknown) => {
          this.limpiarListado();
          this.errorCarga = this.obtenerMensajeError(
            error,
            'No se pudieron obtener las programaciones.',
          );
        },
      });
  }

  private limpiarListado(): void {
    this.programaciones = [];
    this.totalItems = 0;
    this.totalPages = 0;
  }


  // ============================================================
  // CONSULTAR DISPONIBILIDAD
  // ============================================================
  getDisponibilidad(
    filters: DisponibilidadFilters = {},
  ): void {
    if (this.destruido || !this.mostrarModal) {
      return;
    }

    // Cancela la consulta del horario anterior.
    this.disponibilidadSubscription?.unsubscribe();
    this.disponibilidadSubscription = undefined;

    this.limpiarDisponibilidad();

    const params: DisponibilidadFilters = {
      fecha_programada: filters.fecha_programada,
      hora_inicio_programada: filters.hora_inicio_programada,
      hora_fin_programada: filters.hora_fin_programada,

      // Al crear se omite; al editar se excluye el registro actual.
      exclude_programacion_id: this.modoEdicion
        ? this.programacionSeleccionada?.id_programacion
        : undefined,
    };

    this.cargandoDisponibilidad = true;
    this.cdr.markForCheck();

    this.disponibilidadSubscription = forkJoin({
      vehiculos: this.disponibilidadService.getVehiculosDisponibles(params),
      conductores: this.disponibilidadService.getConductoresDisponibles(params),
      recolectores: this.disponibilidadService.getRecolectoresDisponibles(params),
    })
      .pipe(
        finalize(() => {
          this.cargandoDisponibilidad = false;

          if (!this.destruido) {
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: ({ vehiculos, conductores, recolectores }) => {
          const mensajes: string[] = [];

          if (!vehiculos.success || vehiculos.data == null) {
            mensajes.push(
              vehiculos.message ||
              'No se pudieron obtener los vehículos disponibles.',
            );
          }

          if (!conductores.success || conductores.data == null) {
            mensajes.push(
              conductores.message ||
              'No se pudieron obtener los conductores disponibles.',
            );
          }

          if (!recolectores.success || recolectores.data == null) {
            mensajes.push(
              recolectores.message ||
              'No se pudieron obtener los recolectores disponibles.',
            );
          }

          if (mensajes.length > 0) {
            this.errorDisponibilidad = mensajes.join(' ');
            this.cdr.markForCheck();
            return;
          }

          // Publica las tres respuestas del mismo horario juntas.
          this.vehiculosDisponibles = vehiculos.data;
          this.conductoresDisponibles = conductores.data;
          this.recolectoresDisponibles = recolectores.data;


          this.errorDisponibilidad = null;
          this.cdr.markForCheck();
        },

        error: (error: unknown) => {
          this.errorDisponibilidad = this.obtenerMensajeError(
            error,
            'No se pudo consultar la disponibilidad de los recursos.',
          );

          this.cdr.markForCheck();
        },
      });
  }

  private limpiarDisponibilidad(): void {
    this.vehiculosDisponibles = null;
    this.conductoresDisponibles = null;
    this.recolectoresDisponibles = null;

    this.errorDisponibilidad = null;
    this.cargandoDisponibilidad = false;
  }

  private cancelarDisponibilidad(): void {
    this.disponibilidadSubscription?.unsubscribe();
    this.disponibilidadSubscription = undefined;
  }


  // ==========================================================
  // OBTENER RUTAS ACTIVAS
  // ==========================================================
  getRutasActivas(): void {
    if (this.cargandoRutasActivas) {
      return;
    }

    this.cargandoRutasActivas = true;
    this.errorRutasActivas = null;

    this.rutasService
      .getRutasActivas()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.cargandoRutasActivas = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.rutasActivas = [];
            this.errorRutasActivas =
              response.message ||
              'No se pudieron obtener las rutas activas.';

            return;
          }

          this.rutasActivas = response.data ?? [];
        },

        error: (error: unknown) => {
          this.rutasActivas = [];

          const err = error as {
            error?: { message?: string } | string;
            message?: string;
          } | null;

          const mensajeBackend =
            typeof err?.error === 'string'
              ? err.error
              : err?.error?.message;

          this.errorRutasActivas =
            mensajeBackend ||
            err?.message ||
            'Ocurrió un error al cargar las rutas activas.';
        },
      });
  }

  // ============================================================
  // MODAL: PERSONAL DE LA PROGRAMACIÓN
  // ============================================================

  abrirPersonalProgramacion(idProgramacion: number): void {
    this.programacionPersonalId = idProgramacion;
    this.mostrarModalPersonal = true;
  }

  cerrarPersonalProgramacion(): void {
    this.mostrarModalPersonal = false;
    this.programacionPersonalId = null;
  }

  // ============================================================
  // CANCELAR PROGRAMACIÓN
  // ============================================================

  async cancelarProgramacion(
    programacion: ProgramacionPaginadaItem,
  ): Promise<void> {
    if (
      !this.puedeCancelar(programacion) ||
      this.estaProcesando(programacion.id_programacion)
    ) {
      return;
    }

    const id = programacion.id_programacion;

    // Bloquea también mientras está abierto el diálogo.
    this.registrosProcesando.add(id);

    try {
      const resultado = await Swal.fire({
        icon: 'warning',
        title: '¿Cancelar programación?',
        text: `Programación #${id} — ${programacion.ruta.nombre}`,
        input: 'textarea',
        inputLabel: 'Motivo de cancelación',
        inputPlaceholder: 'Indique el motivo de la cancelación.',
        showCancelButton: true,
        confirmButtonText: 'Cancelar programación',
        cancelButtonText: 'Volver',
        confirmButtonColor: '#d33',

        inputValidator: (value) => {
          return typeof value === 'string' && value.trim()
            ? undefined
            : 'Debes indicar el motivo de cancelación.';
        },
      });

      if (!resultado.isConfirmed || this.destruido) {
        this.finalizarAccion(id);
        return;
      }

      const motivo = String(resultado.value ?? '').trim();

      this.programacionesService
        .cancelProgramacion(id, {
          motivo_cancelacion: motivo,
        })
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.finalizarAccion(id)),
        )
        .subscribe({
          next: (response) => {
            if (!response.success) {
              this.mostrarError(
                response.message ||
                'No se pudo cancelar la programación.',
              );
              return;
            }

            void Swal.fire({
              icon: 'success',
              title: 'Programación cancelada',
              text: response.message,
              timer: 1800,
              showConfirmButton: false,
            });

            this.getProgramacionesPaginated();
          },

          error: (error: unknown) => {
            this.mostrarError(
              this.obtenerMensajeError(
                error,
                'No se pudo cancelar la programación.',
              ),
            );
          },
        });
    } catch (error: unknown) {
      this.finalizarAccion(id);

      if (!this.destruido) {
        this.mostrarError(
          this.obtenerMensajeError(
            error,
            'No se pudo iniciar la cancelación.',
          ),
        );
      }
    }
  }

  puedeCancelar(programacion: ProgramacionPaginadaItem): boolean {
    // El backend valida las demás reglas de cancelación.
    return (
      programacion.estado_programacion !== 'FINALIZADA' &&
      programacion.estado_programacion !== 'CANCELADA'
    );
  }

  // ============================================================
  // FILTROS / PAGINACIÓN
  // ============================================================

  onSearchChange(): void {
    this.cancelarBusquedaPendiente();

    this.searchTimeout = setTimeout(() => {
      this.searchTimeout = undefined;
      this.page = 1;
      this.getProgramacionesPaginated();
    }, 300);
  }

  onFiltroChange(): void {
    this.page = 1;
    this.getProgramacionesPaginated();
  }

  cambiarLimite(): void {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getProgramacionesPaginated();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (
      this.isLoading ||
      this.errorFiltros ||
      nuevaPagina < 1 ||
      nuevaPagina > this.totalPages
    ) {
      return;
    }

    this.page = nuevaPagina;
    this.getProgramacionesPaginated();
  }

  limpiarFiltros(): void {
    this.searchBusqueda = '';
    this.fechaDesdeBusqueda = '';
    this.fechaHastaBusqueda = '';
    this.estadoProgramacionBusqueda = '';
    this.rutaBusqueda = null;
    this.vehiculoBusqueda = null;
    this.page = 1;

    this.getProgramacionesPaginated();
  }

  get hayFiltros(): boolean {
    return !!(
      this.searchBusqueda.trim() ||
      this.fechaDesdeBusqueda ||
      this.fechaHastaBusqueda ||
      this.estadoProgramacionBusqueda ||
      this.rutaBusqueda !== null ||
      this.vehiculoBusqueda !== null
    );
  }

  private cancelarBusquedaPendiente(): void {
    if (this.searchTimeout !== undefined) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = undefined;
    }
  }

  // ============================================================
  // FORMULARIO / DETALLE
  // ============================================================

  abrirModal(): void {
    this.getRutasActivas();
    this.cancelarDisponibilidad();
    this.limpiarDisponibilidad();

    this.modoEdicion = false;
    this.programacionSeleccionada = null;
    this.mostrarModal = true;
  }

  abrirEdicion(programacion: ProgramacionPaginadaItem): void {
    this.getRutasActivas();
    this.cancelarDisponibilidad();
    this.limpiarDisponibilidad();

    this.modoEdicion = true;
    this.programacionSeleccionada = programacion;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.cancelarDisponibilidad();
    this.limpiarDisponibilidad();

    this.mostrarModal = false;
    this.modoEdicion = false;
    this.programacionSeleccionada = null;
  }

  abrirDetalle(programacion: ProgramacionPaginadaItem): void {
    this.programacion_id = programacion.id_programacion;
    this.mostrarModalView = true;
  }

  cerrarModalInfo(): void {
    this.mostrarModalView = false;
    this.programacion_id = null;
  }

  // Invocar después de crear o actualizar correctamente.
  onProgramacionGuardada(): void {
    this.getProgramacionesPaginated();
  }

  invalidarDisponibilidadFormulario(): void {
    this.cancelarDisponibilidad();
    this.limpiarDisponibilidad();
    this.cdr.markForCheck();
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getEstadoProgramacion(
    estado: EstadoProgramacion,
  ): { label: string; class: string } {
    const estados: Record<
      EstadoProgramacion,
      { label: string; class: string }
    > = {
      PROGRAMADA: {
        label: 'Programada',
        class: 'badge-info',
      },
      ASIGNADA: {
        label: 'Asignada',
        class: 'badge-primary',
      },
      ACEPTADA: {
        label: 'Aceptada',
        class: 'badge-success',
      },
      EN_CURSO: {
        label: 'En curso',
        class: 'badge-accent',
      },
      PAUSADA: {
        label: 'Pausada',
        class: 'badge-warning',
      },
      FINALIZADA: {
        label: 'Finalizada',
        class: 'badge-neutral',
      },
      CANCELADA: {
        label: 'Cancelada',
        class: 'badge-error',
      },
    };

    return estados[estado];
  }

  getTurno(turno: string): string {
    const turnos: Record<string, string> = {
      MANANA: 'Mañana',
      TARDE: 'Tarde',
      NOCHE: 'Noche',
      ROTATIVO: 'Rotativo',
    };

    return turnos[turno] ?? turno;
  }

  getFuncion(funcion: string): string {
    const funciones: Record<string, string> = {
      CONDUCTOR: 'Conductor',
      RECOLECTOR: 'Recolector',
    };

    return funciones[funcion] ?? funcion;
  }

  getNombrePersonal(
    asignacion: ProgramacionPaginadaPersonalAsignado,
  ): string {
    const usuario = asignacion.personal.usuario;

    const nombre = [
      usuario.persona.nombres,
      usuario.persona.apellidos,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return nombre ||
      usuario.username ||
      asignacion.personal.codigo_empleado;
  }

  getHora(hora: string): string {
    return hora ? hora.slice(0, 5) : 'No registrada';
  }

  estaProcesando(id: number): boolean {
    return this.registrosProcesando.has(id);
  }

  private finalizarAccion(id: number): void {
    this.registrosProcesando.delete(id);

    if (!this.destruido) {
      this.cdr.markForCheck();
    }
  }

  private obtenerMensajeError(
    error: unknown,
    fallback: string,
  ): string {
    const detalle = error as {
      message?: unknown;
      error?: { message?: unknown };
    } | null;

    const mensaje = detalle?.error?.message ?? detalle?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : fallback;
  }

  private mostrarError(mensaje: string): void {
    void Swal.fire({
      icon: 'error',
      title: 'No se pudo completar la operación',
      text: mensaje,
    });
  }
}


// import { CommonModule } from '@angular/common';
// import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { finalize, forkJoin, of, Subscription, switchMap } from 'rxjs';
// import Swal from 'sweetalert2';

// // Directives
// import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// // Services
// import { ProgramacionesService } from '../../services/programaciones.service';
// import { DisponibilidadService } from '../../services/disponibilidad.service';
// import { RutasServices } from '../../../rutas/services/rutas.service';

// // Interfaces
// import { EstadoProgramacion, ProgramacionPaginadaItem, ProgramacionPaginadaPersonalAsignado, ProgramacionPaginadaRuta, ProgramacionPaginadaVehiculo, ProgramacionesPaginadasFilters } from '../../interfaces/programaciones';
// import { DisponibilidadFilters, GetVehiculosDisponiblesResponse, GetConductoresDisponiblesResponse, GetRecolectoresDisponiblesResponse } from '../../interfaces/disponibilidad';
// import { RutaActivaData } from '../../../rutas/interfaces/rutas/get-rutas-activas.interface';

// // Componentes
// import { ProgramacionesFormComponent } from '../components/programaciones-form/programaciones-form.component';
// import { ProgramacionesViewComponent } from '../components/programaciones-view/programaciones-view.component';
// import { ProgramacionesPersonalComponent } from '../components/programaciones-personal/programaciones-personal.component';

// @Component({
//   selector: 'app-programaciones-page',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ProgramacionesFormComponent,
//     ProgramacionesViewComponent,
//     ProgramacionesPersonalComponent
//   ],
//   templateUrl: './programaciones-page.component.html',
//   styles: ``,
// })
// export class ProgramacionesPageComponent implements OnInit, OnDestroy {
//   private readonly destroyRef = inject(DestroyRef);

//   // ============================================================
//   // LISTAS PARA LOS SELECTORES
//   // Reciben las opciones completas, no solo las de la página.
//   // ============================================================

//   @Input() rutasFiltro: ProgramacionPaginadaRuta[] = [];
//   @Input() vehiculosFiltro: Pick<
//     ProgramacionPaginadaVehiculo,
//     'id_vehiculo' | 'codigo' | 'placa'
//   >[] = [];

//   // ============================================================
//   // EVENTOS PARA FORMULARIO Y DETALLE
//   // ============================================================

//   @Output() nuevaProgramacion = new EventEmitter<void>();
//   @Output() editarProgramacion = new EventEmitter<ProgramacionPaginadaItem>();
//   @Output() verProgramacion = new EventEmitter<number>();

//   // ============================================================
//   // ESTADO
//   // ============================================================

//   programaciones: ProgramacionPaginadaItem[] = [];

//   isLoading = false;
//   errorCarga: string | null = null;
//   errorFiltros: string | null = null;

//   readonly registrosProcesando = new Set<number>();

//   private listadoSubscription?: Subscription;
//   private searchTimeout?: ReturnType<typeof setTimeout>;
//   private destruido = false;

//   mostrarModal = false;
//   modoEdicion = false;
//   programacionSeleccionada: ProgramacionPaginadaItem | null = null;

//   mostrarModalPersonal = false;
//   programacionPersonalId: number | null = null;

//   // ============================================================
//   // DISPONIBILIDAD PARA EL FORMULARIO
//   // ============================================================
//   vehiculosDisponibles: GetVehiculosDisponiblesResponse['data'] | null = null;

//   conductoresDisponibles: GetConductoresDisponiblesResponse['data'] | null = null;

//   recolectoresDisponibles: GetRecolectoresDisponiblesResponse['data'] | null = null;

//   rutasActivas: RutaActivaData[] = [];

//   cargandoDisponibilidad = false;
//   errorDisponibilidad: string | null = null;

//   cargandoRutasActivas = false;
//   errorRutasActivas: string | null = null;

//   private disponibilidadSubscription?: Subscription;

//   // ============================================================
//   // FILTROS
//   // ============================================================

//   searchBusqueda = '';
//   fechaDesdeBusqueda = '';
//   fechaHastaBusqueda = '';

//   estadoProgramacionBusqueda: EstadoProgramacion | '' = '';

//   rutaBusqueda: number | null = null;
//   vehiculoBusqueda: number | null = null;
//   mostrarModalView = false;
//   programacion_id: number | null = null;

//   // ============================================================
//   // PAGINACIÓN
//   // ============================================================

//   page = 1;
//   limit = 5;
//   totalItems = 0;
//   totalPages = 0;

//   readonly pageSizeOptions = [5, 10, 20, 50];

//   // ============================================================
//   // SELECTORES
//   // ============================================================

//   readonly estadosProgramacion: {
//     value: EstadoProgramacion;
//     label: string;
//   }[] = [
//       { value: 'PROGRAMADA', label: 'Programada' },
//       { value: 'ASIGNADA', label: 'Asignada' },
//       { value: 'ACEPTADA', label: 'Aceptada' },
//       { value: 'EN_CURSO', label: 'En curso' },
//       { value: 'PAUSADA', label: 'Pausada' },
//       { value: 'FINALIZADA', label: 'Finalizada' },
//       { value: 'CANCELADA', label: 'Cancelada' },
//     ];

//   constructor(
//     private readonly programacionesService: ProgramacionesService,
//     private readonly disponibilidadService: DisponibilidadService,
//     private readonly rutasService: RutasServices,
//     private readonly cdr: ChangeDetectorRef,
//   ) { }

//   ngOnInit(): void {
//     this.getProgramacionesPaginated();
//     this.obtenerRutasActivas();
//   }

//   ngOnDestroy(): void {
//     this.destruido = true;
//     this.cancelarBusquedaPendiente();
//     this.listadoSubscription?.unsubscribe();
//     this.cancelarDisponibilidad();

//   }

//   // ============================================================
//   // LISTADO
//   // ============================================================
//   getProgramacionesPaginated(): void {
//     this.cancelarBusquedaPendiente();
//     this.listadoSubscription?.unsubscribe();

//     this.errorFiltros = null;
//     this.errorCarga = null;

//     if (
//       this.fechaDesdeBusqueda &&
//       this.fechaHastaBusqueda &&
//       this.fechaDesdeBusqueda > this.fechaHastaBusqueda
//     ) {
//       this.errorFiltros =
//         'La fecha inicial no puede ser posterior a la fecha final.';
//       return;
//     }

//     const params: ProgramacionesPaginadasFilters = {
//       page: this.page,
//       limit: this.limit,
//       search: this.searchBusqueda.trim() || undefined,
//       fecha_desde: this.fechaDesdeBusqueda || undefined,
//       fecha_hasta: this.fechaHastaBusqueda || undefined,
//       estado_programacion:
//         this.estadoProgramacionBusqueda || undefined,
//       id_ruta: this.rutaBusqueda ?? undefined,
//       id_vehiculo: this.vehiculoBusqueda ?? undefined,
//     };

//     this.isLoading = true;

//     this.listadoSubscription = this.programacionesService
//       .getProgramacionesPaginated(params)
//       .pipe(
//         // Si una cancelación reduce las páginas disponibles,
//         // consulta nuevamente la última página válida.
//         switchMap((response) => {
//           if (!response.success || !response.data) {
//             return of(response);
//           }

//           const ultimaPagina = Math.max(
//             1,
//             response.data.total_pages,
//           );

//           if (this.page > ultimaPagina) {
//             this.page = ultimaPagina;

//             return this.programacionesService
//               .getProgramacionesPaginated({
//                 ...params,
//                 page: ultimaPagina,
//               });
//           }

//           return of(response);
//         }),

//         finalize(() => {
//           this.isLoading = false;

//           if (!this.destruido) {
//             this.cdr.markForCheck();
//           }
//         }),
//       )
//       .subscribe({
//         next: (response) => {
//           if (!response.success || !response.data) {
//             this.limpiarListado();
//             this.errorCarga =
//               response.message ||
//               'No se pudieron obtener las programaciones.';
//             return;
//           }

//           const paginacion = response.data;

//           this.programaciones = paginacion.items;
//           this.totalItems = paginacion.total;
//           this.page = paginacion.page;
//           this.limit = paginacion.limit;
//           this.totalPages = paginacion.total_pages;
//         },

//         error: (error: unknown) => {
//           this.limpiarListado();
//           this.errorCarga = this.obtenerMensajeError(
//             error,
//             'No se pudieron obtener las programaciones.',
//           );
//         },
//       });
//   }

//   private limpiarListado(): void {
//     this.programaciones = [];
//     this.totalItems = 0;
//     this.totalPages = 0;
//   }


//   // ============================================================
//   // CONSULTAR DISPONIBILIDAD
//   // ============================================================
//   getDisponibilidad(
//     filters: DisponibilidadFilters = {},
//   ): void {
//     if (this.destruido || !this.mostrarModal) {
//       return;
//     }

//     // Cancela la consulta del horario anterior.
//     this.disponibilidadSubscription?.unsubscribe();
//     this.disponibilidadSubscription = undefined;

//     this.limpiarDisponibilidad();

//     const params: DisponibilidadFilters = {
//       fecha_programada: filters.fecha_programada,
//       hora_inicio_programada: filters.hora_inicio_programada,
//       hora_fin_programada: filters.hora_fin_programada,

//       // Al crear se omite; al editar se excluye el registro actual.
//       exclude_programacion_id: this.modoEdicion
//         ? this.programacionSeleccionada?.id_programacion
//         : undefined,
//     };

//     this.cargandoDisponibilidad = true;
//     this.cdr.markForCheck();

//     this.disponibilidadSubscription = forkJoin({
//       vehiculos: this.disponibilidadService.getVehiculosDisponibles(params),
//       conductores: this.disponibilidadService.getConductoresDisponibles(params),
//       recolectores: this.disponibilidadService.getRecolectoresDisponibles(params),
//     })
//       .pipe(
//         finalize(() => {
//           this.cargandoDisponibilidad = false;

//           if (!this.destruido) {
//             this.cdr.markForCheck();
//           }
//         }),
//       )
//       .subscribe({
//         next: ({ vehiculos, conductores, recolectores }) => {
//           const mensajes: string[] = [];

//           if (!vehiculos.success || vehiculos.data == null) {
//             mensajes.push(
//               vehiculos.message ||
//               'No se pudieron obtener los vehículos disponibles.',
//             );
//           }

//           if (!conductores.success || conductores.data == null) {
//             mensajes.push(
//               conductores.message ||
//               'No se pudieron obtener los conductores disponibles.',
//             );
//           }

//           if (!recolectores.success || recolectores.data == null) {
//             mensajes.push(
//               recolectores.message ||
//               'No se pudieron obtener los recolectores disponibles.',
//             );
//           }

//           if (mensajes.length > 0) {
//             this.errorDisponibilidad = mensajes.join(' ');
//             this.cdr.markForCheck();
//             return;
//           }

//           // Publica las tres respuestas del mismo horario juntas.
//           this.vehiculosDisponibles = vehiculos.data;
//           this.conductoresDisponibles = conductores.data;
//           this.recolectoresDisponibles = recolectores.data;

//           console.log("vehiculos disponibles: ", this.vehiculosDisponibles);
//           console.log("conductores disponibles: ", this.conductoresDisponibles);
//           console.log("recolectores disponibles: ", this.recolectoresDisponibles);

//           this.errorDisponibilidad = null;
//           this.cdr.markForCheck();
//         },

//         error: (error: unknown) => {
//           this.errorDisponibilidad = this.obtenerMensajeError(
//             error,
//             'No se pudo consultar la disponibilidad de los recursos.',
//           );

//           this.cdr.markForCheck();
//         },
//       });
//   }

//   private limpiarDisponibilidad(): void {
//     this.vehiculosDisponibles = null;
//     this.conductoresDisponibles = null;
//     this.recolectoresDisponibles = null;

//     this.errorDisponibilidad = null;
//     this.cargandoDisponibilidad = false;
//   }

//   private cancelarDisponibilidad(): void {
//     this.disponibilidadSubscription?.unsubscribe();
//     this.disponibilidadSubscription = undefined;
//   }


//   // ==========================================================
//   // OBTENER RUTAS ACTIVAS
//   // ==========================================================
//   obtenerRutasActivas(): void {
//     if (this.cargandoRutasActivas) {
//       return;
//     }

//     this.cargandoRutasActivas = true;
//     this.errorRutasActivas = null;

//     this.rutasService
//       .getRutasActivas()
//       .pipe(
//         finalize(() => {
//           this.cargandoRutasActivas = false;
//           this.cdr.markForCheck();
//         }),
//       )
//       .subscribe({
//         next: (response) => {
//           if (!response.success) {
//             this.rutasActivas = [];
//             this.errorRutasActivas =
//               response.message ||
//               'No se pudieron obtener las rutas activas.';

//             return;
//           }

//           this.rutasActivas = response.data ?? [];
//         },

//         error: (error: unknown) => {
//           this.rutasActivas = [];

//           const err = error as {
//             error?: { message?: string } | string;
//             message?: string;
//           } | null;

//           const mensajeBackend =
//             typeof err?.error === 'string'
//               ? err.error
//               : err?.error?.message;

//           this.errorRutasActivas =
//             mensajeBackend ||
//             err?.message ||
//             'Ocurrió un error al cargar las rutas activas.';
//         },
//       });
//   }

//   // ============================================================
//   // MODAL: PERSONAL DE LA PROGRAMACIÓN
//   // ============================================================

//   abrirPersonalProgramacion(idProgramacion: number): void {
//     this.programacionPersonalId = idProgramacion;
//     this.mostrarModalPersonal = true;
//   }

//   cerrarPersonalProgramacion(): void {
//     this.mostrarModalPersonal = false;
//     this.programacionPersonalId = null;
//   }

//   // ============================================================
//   // CANCELAR PROGRAMACIÓN
//   // ============================================================

//   async cancelarProgramacion(
//     programacion: ProgramacionPaginadaItem,
//   ): Promise<void> {
//     if (
//       !this.puedeCancelar(programacion) ||
//       this.estaProcesando(programacion.id_programacion)
//     ) {
//       return;
//     }

//     const id = programacion.id_programacion;

//     // Bloquea también mientras está abierto el diálogo.
//     this.registrosProcesando.add(id);

//     try {
//       const resultado = await Swal.fire({
//         icon: 'warning',
//         title: '¿Cancelar programación?',
//         text: `Programación #${id} — ${programacion.ruta.nombre}`,
//         input: 'textarea',
//         inputLabel: 'Motivo de cancelación',
//         inputPlaceholder: 'Indique el motivo de la cancelación.',
//         showCancelButton: true,
//         confirmButtonText: 'Cancelar programación',
//         cancelButtonText: 'Volver',
//         confirmButtonColor: '#d33',

//         inputValidator: (value) => {
//           return typeof value === 'string' && value.trim()
//             ? undefined
//             : 'Debes indicar el motivo de cancelación.';
//         },
//       });

//       if (!resultado.isConfirmed || this.destruido) {
//         this.finalizarAccion(id);
//         return;
//       }

//       const motivo = String(resultado.value ?? '').trim();

//       this.programacionesService
//         .cancelProgramacion(id, {
//           motivo_cancelacion: motivo,
//         })
//         .pipe(
//           takeUntilDestroyed(this.destroyRef),
//           finalize(() => this.finalizarAccion(id)),
//         )
//         .subscribe({
//           next: (response) => {
//             if (!response.success) {
//               this.mostrarError(
//                 response.message ||
//                 'No se pudo cancelar la programación.',
//               );
//               return;
//             }

//             void Swal.fire({
//               icon: 'success',
//               title: 'Programación cancelada',
//               text: response.message,
//               timer: 1800,
//               showConfirmButton: false,
//             });

//             this.getProgramacionesPaginated();
//           },

//           error: (error: unknown) => {
//             this.mostrarError(
//               this.obtenerMensajeError(
//                 error,
//                 'No se pudo cancelar la programación.',
//               ),
//             );
//           },
//         });
//     } catch (error: unknown) {
//       this.finalizarAccion(id);

//       if (!this.destruido) {
//         this.mostrarError(
//           this.obtenerMensajeError(
//             error,
//             'No se pudo iniciar la cancelación.',
//           ),
//         );
//       }
//     }
//   }

//   puedeCancelar(programacion: ProgramacionPaginadaItem): boolean {
//     // El backend valida las demás reglas de cancelación.
//     return (
//       programacion.estado_programacion !== 'FINALIZADA' &&
//       programacion.estado_programacion !== 'CANCELADA'
//     );
//   }

//   // ============================================================
//   // FILTROS / PAGINACIÓN
//   // ============================================================

//   onSearchChange(): void {
//     this.cancelarBusquedaPendiente();

//     this.searchTimeout = setTimeout(() => {
//       this.searchTimeout = undefined;
//       this.page = 1;
//       this.getProgramacionesPaginated();
//     }, 300);
//   }

//   onFiltroChange(): void {
//     this.page = 1;
//     this.getProgramacionesPaginated();
//   }

//   cambiarLimite(): void {
//     this.limit = Number(this.limit);
//     this.page = 1;
//     this.getProgramacionesPaginated();
//   }

//   cambiarPagina(nuevaPagina: number): void {
//     if (
//       this.isLoading ||
//       this.errorFiltros ||
//       nuevaPagina < 1 ||
//       nuevaPagina > this.totalPages
//     ) {
//       return;
//     }

//     this.page = nuevaPagina;
//     this.getProgramacionesPaginated();
//   }

//   limpiarFiltros(): void {
//     this.searchBusqueda = '';
//     this.fechaDesdeBusqueda = '';
//     this.fechaHastaBusqueda = '';
//     this.estadoProgramacionBusqueda = '';
//     this.rutaBusqueda = null;
//     this.vehiculoBusqueda = null;
//     this.page = 1;

//     this.getProgramacionesPaginated();
//   }

//   get hayFiltros(): boolean {
//     return !!(
//       this.searchBusqueda.trim() ||
//       this.fechaDesdeBusqueda ||
//       this.fechaHastaBusqueda ||
//       this.estadoProgramacionBusqueda ||
//       this.rutaBusqueda !== null ||
//       this.vehiculoBusqueda !== null
//     );
//   }

//   private cancelarBusquedaPendiente(): void {
//     if (this.searchTimeout !== undefined) {
//       clearTimeout(this.searchTimeout);
//       this.searchTimeout = undefined;
//     }
//   }

//   // ============================================================
//   // FORMULARIO / DETALLE
//   // ============================================================

//   abrirModal(): void {
//     this.cancelarDisponibilidad();
//     this.limpiarDisponibilidad();

//     this.modoEdicion = false;
//     this.programacionSeleccionada = null;
//     this.mostrarModal = true;
//   }

//   abrirEdicion(programacion: ProgramacionPaginadaItem): void {
//     this.cancelarDisponibilidad();
//     this.limpiarDisponibilidad();

//     this.modoEdicion = true;
//     this.programacionSeleccionada = programacion;
//     this.mostrarModal = true;
//   }

//   cerrarModal(): void {
//     this.cancelarDisponibilidad();
//     this.limpiarDisponibilidad();

//     this.mostrarModal = false;
//     this.modoEdicion = false;
//     this.programacionSeleccionada = null;
//   }

//   abrirDetalle(programacion: ProgramacionPaginadaItem): void {
//     this.programacion_id = programacion.id_programacion;
//     this.mostrarModalView = true;
//   }

//   cerrarModalInfo(): void {
//     this.mostrarModalView = false;
//     this.programacion_id = null;
//   }

//   // Invocar después de crear o actualizar correctamente.
//   onProgramacionGuardada(): void {
//     this.getProgramacionesPaginated();
//   }

//   invalidarDisponibilidadFormulario(): void {
//     this.cancelarDisponibilidad();
//     this.limpiarDisponibilidad();
//     this.cdr.markForCheck();
//   }

//   // ============================================================
//   // HELPERS
//   // ============================================================

//   getEstadoProgramacion(
//     estado: EstadoProgramacion,
//   ): { label: string; class: string } {
//     const estados: Record<
//       EstadoProgramacion,
//       { label: string; class: string }
//     > = {
//       PROGRAMADA: {
//         label: 'Programada',
//         class: 'badge-info',
//       },
//       ASIGNADA: {
//         label: 'Asignada',
//         class: 'badge-primary',
//       },
//       ACEPTADA: {
//         label: 'Aceptada',
//         class: 'badge-success',
//       },
//       EN_CURSO: {
//         label: 'En curso',
//         class: 'badge-accent',
//       },
//       PAUSADA: {
//         label: 'Pausada',
//         class: 'badge-warning',
//       },
//       FINALIZADA: {
//         label: 'Finalizada',
//         class: 'badge-neutral',
//       },
//       CANCELADA: {
//         label: 'Cancelada',
//         class: 'badge-error',
//       },
//     };

//     return estados[estado];
//   }

//   getTurno(turno: string): string {
//     const turnos: Record<string, string> = {
//       MANANA: 'Mañana',
//       TARDE: 'Tarde',
//       NOCHE: 'Noche',
//       ROTATIVO: 'Rotativo',
//     };

//     return turnos[turno] ?? turno;
//   }

//   getFuncion(funcion: string): string {
//     const funciones: Record<string, string> = {
//       CONDUCTOR: 'Conductor',
//       RECOLECTOR: 'Recolector',
//     };

//     return funciones[funcion] ?? funcion;
//   }

//   getNombrePersonal(
//     asignacion: ProgramacionPaginadaPersonalAsignado,
//   ): string {
//     const usuario = asignacion.personal.usuario;

//     const nombre = [
//       usuario.persona.nombres,
//       usuario.persona.apellidos,
//     ]
//       .filter(Boolean)
//       .join(' ')
//       .trim();

//     return nombre ||
//       usuario.username ||
//       asignacion.personal.codigo_empleado;
//   }

//   getHora(hora: string): string {
//     return hora ? hora.slice(0, 5) : 'No registrada';
//   }

//   estaProcesando(id: number): boolean {
//     return this.registrosProcesando.has(id);
//   }

//   private finalizarAccion(id: number): void {
//     this.registrosProcesando.delete(id);

//     if (!this.destruido) {
//       this.cdr.markForCheck();
//     }
//   }

//   private obtenerMensajeError(
//     error: unknown,
//     fallback: string,
//   ): string {
//     const detalle = error as {
//       message?: unknown;
//       error?: { message?: unknown };
//     } | null;

//     const mensaje = detalle?.error?.message ?? detalle?.message;

//     return typeof mensaje === 'string' && mensaje.trim()
//       ? mensaje
//       : fallback;
//   }

//   private mostrarError(mensaje: string): void {
//     void Swal.fire({
//       icon: 'error',
//       title: 'No se pudo completar la operación',
//       text: mensaje,
//     });
//   }
// }
