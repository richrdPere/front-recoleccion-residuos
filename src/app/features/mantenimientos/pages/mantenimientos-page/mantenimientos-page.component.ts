import { CommonModule, DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, finalize, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Services
import { MantenimientoService } from '../../services/mantenimiento.service';
import { VehiculosService } from 'src/app/features/vehiculos/services/vehiculos.service';

// Interfaces
import { EstadoMantenimiento, MantenimientoDetalleData, MantenimientoPaginadoItem, TipoMantenimiento, VehiculoExpedienteData, VehiculosExpedientesPaginadosFilters, ExpedienteEstadoOperativoVehiculo, ExpedienteTipoVehiculo } from '../../interfaces';
import { VehiculoSelectorItem } from 'src/app/features/vehiculos/models';


@Component({
  selector: 'app-mantenimientos-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    CommonModule,
    UppercaseDirective,

  ],
  templateUrl: './mantenimientos-page.component.html',
})
export class MantenimientosPageComponent implements OnInit, OnDestroy {

  // *********************************************************
  // EXPEDIENTES DE VEHÍCULOS
  // *********************************************************
  vehiculos: VehiculoExpedienteData[] = [];
  vehiculo_id: number | null = null;

  isLoading = false;
  errorMensaje = '';

  // *********************************************************
  // MANTENIMIENTOS Y MODALES
  // *********************************************************
  mantenimientos: MantenimientoPaginadoItem[] = [];
  mantenimiento_id: number | null = null;

  mostrarModal = false;
  mostrarModalView = false;
  modoEdicion = false;

  vehiculoExpedienteSeleccionado: VehiculoExpedienteData | null = null;

  mantenimientoSeleccionado: MantenimientoPaginadoItem | null = null;

  mostrarModalInicio = false;
  mantenimientoParaIniciar: MantenimientoPaginadoItem | null = null;

  mostrarModalFinalizacion = false;
  mantenimientoParaFinalizar: MantenimientoPaginadoItem | null = null;

  mostrarModalCancelacion = false;
  mantenimientoParaCancelar: MantenimientoPaginadoItem | null = null;

  // *********************************************************
  // FILTROS
  // *********************************************************
  searchBusqueda = '';

  estadoOperativoBusqueda:
    ExpedienteEstadoOperativoVehiculo | '' = '';

  tipoVehiculoBusqueda: ExpedienteTipoVehiculo | '' = '';

  // Incluir también vehículos sin mantenimientos.
  soloConMantenimientos = false;

  // *********************************************************
  // PAGINACIÓN
  // *********************************************************
  page = 1;
  limit = 4;
  currentPage = 1;
  totalItems = 0;
  totalPages = 0;

  hasNextPage = false;
  hasPreviousPage = false;

  readonly pageSizeOptions = [4, 8, 20, 32];

  // *********************************************************
  // SELECTORES
  // *********************************************************
  vehiculosDisponibles: VehiculoSelectorItem[] = [];

  readonly tiposVehiculo: {
    value: ExpedienteTipoVehiculo;
    label: string;
  }[] = [
      { value: 'CAMION_COMPACTADOR', label: 'CAMIÓN COMPACTADOR' },
      { value: 'CAMION_BARANDA', label: 'CAMIÓN BARANDA' },
      { value: 'CAMION_VOLQUETE', label: 'CAMIÓN VOLQUETE' },
      { value: 'MOTOFURGON', label: 'MOTOFURGÓN' },
      { value: 'OTRO', label: 'OTRO' },
    ];

  readonly estadosOperativos: {
    value: ExpedienteEstadoOperativoVehiculo;
    label: string;
  }[] = [
      { value: 'DISPONIBLE', label: 'DISPONIBLE' },
      { value: 'ASIGNADO', label: 'ASIGNADO' },
      { value: 'EN_RUTA', label: 'EN RUTA' },
      { value: 'EN_MANTENIMIENTO', label: 'EN MANTENIMIENTO' },
      { value: 'FUERA_DE_SERVICIO', label: 'FUERA DE SERVICIO' },
    ];

  readonly tipoMantenimiento: {
    value: TipoMantenimiento;
    label: string;
  }[] = [
      { value: 'PREVENTIVO', label: 'Preventivo' },
      { value: 'CORRECTIVO', label: 'Correctivo' },
    ];

  readonly estadoMantenimiento: {
    value: EstadoMantenimiento;
    label: string;
  }[] = [
      { value: 'PROGRAMADO', label: 'Programado' },
      { value: 'EN_PROCESO', label: 'En proceso' },
      { value: 'FINALIZADO', label: 'Finalizado' },
      { value: 'CANCELADO', label: 'Cancelado' },
    ];

  // *********************************************************
  // CONTROL DE SUSCRIPCIONES
  // *********************************************************
  private readonly destroy$ = new Subject<void>();
  private expedientesSubscription?: Subscription;

  private searchTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly router: Router,
    private readonly mantenimientoService: MantenimientoService,
    private readonly vehiculosService: VehiculosService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // *********************************************************
  // 1. INICIALIZAR
  // *********************************************************
  ngOnInit(): void {
    this.getVehiculosPaginated();
    this.initVehiculosDisponibles();
  }

  // *********************************************************
  // 2. OBTENER EXPEDIENTES PAGINADOS
  // *********************************************************
  getVehiculosPaginated(): void {
    // Cancelar la consulta anterior para evitar que una
    // respuesta antigua reemplace los filtros actuales.
    this.expedientesSubscription?.unsubscribe();

    const filters: VehiculosExpedientesPaginadosFilters = {
      page: this.page,
      limit: this.limit,
      search: this.searchBusqueda.trim() || undefined,
      estado_operativo: this.estadoOperativoBusqueda || undefined,
      tipo_vehiculo: this.tipoVehiculoBusqueda || undefined,
      solo_con_mantenimientos: this.soloConMantenimientos,

      sort_by: 'id_vehiculo',
      sort_order: 'DESC',
    };

    this.isLoading = true;
    this.errorMensaje = '';
    this.cdr.markForCheck();

    this.expedientesSubscription = this.mantenimientoService
      .getVehiculosExpedientesPaginated(filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.limpiarResultados();

            this.errorMensaje =
              response.message ||
              'No se pudieron obtener los expedientes.';

            this.cdr.markForCheck();
            return;
          }

          const { vehiculos, pagination } = response.data;

          this.vehiculos = vehiculos;

          this.totalItems = pagination.total;
          this.totalPages = pagination.total_pages;

          this.page = pagination.page;
          this.currentPage = pagination.page;
          this.limit = pagination.limit;

          this.hasNextPage = pagination.has_next_page;
          this.hasPreviousPage = pagination.has_previous_page;

          this.cdr.markForCheck();
        },
        error: (error) => {
          this.limpiarResultados();

          this.errorMensaje =
            error?.error?.message ||
            error?.message ||
            'No se pudieron obtener los expedientes.';

          this.cdr.markForCheck();

          void Swal.fire({
            icon: 'error',
            title: 'No se pudieron cargar los expedientes',
            text: this.errorMensaje,
          });
        },
      });
  }

  private limpiarResultados(): void {
    this.vehiculos = [];
    this.totalItems = 0;
    this.totalPages = 0;
    this.hasNextPage = false;
    this.hasPreviousPage = false;
  }

  // *********************************************************
  // 3. CARGAR SELECTOR DE VEHÍCULOS
  // *********************************************************
  initVehiculosDisponibles(): void {
    this.vehiculosService
      .getVehiculoSelector()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.vehiculosDisponibles =
            response.success ? response.data : [];

          this.cdr.markForCheck();
        },
        error: (error) => {
          this.vehiculosDisponibles = [];
          this.cdr.markForCheck();

          void Swal.fire({
            icon: 'error',
            title: 'No se pudieron cargar los vehículos',
            text:
              error?.error?.message ||
              error?.message ||
              'Intenta nuevamente.',
          });
        },
      });
  }

  // *********************************************************
  // 4. FILTROS
  // *********************************************************
  limpiarFiltros(): void {
    clearTimeout(this.searchTimeout);

    this.searchBusqueda = '';
    this.estadoOperativoBusqueda = '';
    this.tipoVehiculoBusqueda = '';
    this.soloConMantenimientos = false;

    this.page = 1;
    this.currentPage = 1;

    this.getVehiculosPaginated();
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.currentPage = 1;
      this.getVehiculosPaginated();
    }, 300);
  }

  onFiltroChange(): void {
    clearTimeout(this.searchTimeout);

    this.page = 1;
    this.currentPage = 1;

    this.getVehiculosPaginated();
  }

  get hayFiltros(): boolean {
    return !!(
      this.searchBusqueda.trim() ||
      this.tipoVehiculoBusqueda ||
      this.estadoOperativoBusqueda ||
      this.soloConMantenimientos
    );
  }

  // *********************************************************
  // 5. PAGINACIÓN
  // *********************************************************
  cambiarPagina(nuevaPagina: number): void {
    if (
      this.isLoading ||
      nuevaPagina < 1 ||
      nuevaPagina > this.totalPages ||
      nuevaPagina === this.page
    ) {
      return;
    }

    clearTimeout(this.searchTimeout);

    this.page = nuevaPagina;
    this.currentPage = nuevaPagina;

    this.getVehiculosPaginated();
  }

  cambiarLimite(): void {
    clearTimeout(this.searchTimeout);

    const nuevoLimite = Number(this.limit);

    this.limit = this.pageSizeOptions.includes(nuevoLimite)
      ? nuevoLimite
      : this.pageSizeOptions[0];

    this.page = 1;
    this.currentPage = 1;

    this.getVehiculosPaginated();
  }

  onPageSizeChange(): void {
    this.cambiarLimite();
  }

  // *********************************************************
  // 6. ACCIONES SOBRE MANTENIMIENTOS INDIVIDUALES
  // *********************************************************
  iniciarMantenimiento(mant: MantenimientoPaginadoItem): void {
    if (mant.estado_mantenimiento !== 'PROGRAMADO') {
      return;
    }

    this.mantenimientoParaIniciar = mant;
    this.mostrarModalInicio = true;
  }

  finalizarMantenimiento(mant: MantenimientoPaginadoItem): void {
    if (mant.estado_mantenimiento !== 'EN_PROCESO') {
      return;
    }

    this.mantenimientoParaFinalizar = mant;
    this.mostrarModalFinalizacion = true;
  }

  cancelarMantenimiento(mant: MantenimientoPaginadoItem): void {
    if (mant.estado_mantenimiento !== 'PROGRAMADO') {
      return;
    }

    this.mantenimientoParaCancelar = mant;
    this.mostrarModalCancelacion = true;
  }

  editarMantenimiento(mant: MantenimientoPaginadoItem): void {
    this.modoEdicion = true;
    this.mantenimientoSeleccionado = { ...mant };
    this.mostrarModal = true;
  }

  verMantenimiento(mant: MantenimientoPaginadoItem): void {
    this.mantenimiento_id = mant.id_mantenimiento;
    this.mostrarModalView = true;
  }

  abrirExpediente(vehiculo: VehiculoExpedienteData): void {
    // this.vehiculoExpedienteSeleccionado = vehiculo;

    if (vehiculo.id_vehiculo === null ||
      vehiculo.id_vehiculo === undefined) {
      return;
    }

    void this.router.navigate(
      [
        '/admin',
        'mantenimientos',
        vehiculo.id_vehiculo,
      ],
      {
        state: {
          vehiculo: vehiculo,
        },
      },
    );
  }

  cerrarExpediente(): void {
    this.vehiculoExpedienteSeleccionado = null;
  }

  // *********************************************************
  // 7. MODALES
  // *********************************************************
  abrirModal(): void {
    this.modoEdicion = false;
    this.mantenimientoSeleccionado = null;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  cerrarModalInfo(): void {
    this.mostrarModalView = false;
    this.mantenimiento_id = null;
  }

  cerrarModalInicio(): void {
    this.mostrarModalInicio = false;
    this.mantenimientoParaIniciar = null;
  }

  cerrarModalFinalizacion(): void {
    this.mostrarModalFinalizacion = false;
    this.mantenimientoParaFinalizar = null;
  }

  cerrarModalCancelacion(): void {
    this.mostrarModalCancelacion = false;
    this.mantenimientoParaCancelar = null;
  }

  // *********************************************************
  // 8. RECARGAR RESÚMENES DESPUÉS DE LAS OPERACIONES
  // *********************************************************
  onMantenimientoIniciado(
    _mantenimiento: MantenimientoDetalleData,
  ): void {
    this.getVehiculosPaginated();
  }

  onMantenimientoFinalizado(
    _mantenimiento: MantenimientoDetalleData,
  ): void {
    this.getVehiculosPaginated();
  }

  onMantenimientoCancelado(): void {
    this.getVehiculosPaginated();
  }

  // *********************************************************
  // 9. HELPERS
  // *********************************************************
  obtenerTipoVehiculo(tipo: ExpedienteTipoVehiculo): {
    label: string;
    icon: string;
  } {
    const tipos: Record<
      ExpedienteTipoVehiculo,
      { label: string; icon: string }
    > = {
      CAMION_COMPACTADOR: {
        label: 'Camión compactador',
        icon: 'fa-truck',
      },
      CAMION_BARANDA: {
        label: 'Camión baranda',
        icon: 'fa-truck-pickup',
      },
      CAMION_VOLQUETE: {
        label: 'Camión volquete',
        icon: 'fa-truck-moving',
      },
      MOTOFURGON: {
        label: 'Motofurgón',
        icon: 'fa-motorcycle',
      },
      OTRO: {
        label: 'Otro',
        icon: 'fa-car-side',
      },
    };

    return tipos[tipo] ?? {
      label: 'No especificado',
      icon: 'fa-truck',
    };
  }

  obtenerEstadoOperativo(
    estado: ExpedienteEstadoOperativoVehiculo,
  ): {
    label: string;
    class: string;
  } {
    const estados: Record<
      ExpedienteEstadoOperativoVehiculo,
      { label: string; class: string }
    > = {
      DISPONIBLE: {
        label: 'Disponible',
        class: 'badge-success',
      },
      ASIGNADO: {
        label: 'Asignado',
        class: 'badge-primary',
      },
      EN_RUTA: {
        label: 'En ruta',
        class: 'badge-info',
      },
      EN_MANTENIMIENTO: {
        label: 'En mantenimiento',
        class: 'badge-warning',
      },
      FUERA_DE_SERVICIO: {
        label: 'Fuera de servicio',
        class: 'badge-error',
      },
    };

    return estados[estado] ?? {
      label: 'No especificado',
      class: 'badge-neutral',
    };
  }

  // *********************************************************
  // 10. DESTRUIR COMPONENTE
  // *********************************************************
  ngOnDestroy(): void {
    clearTimeout(this.searchTimeout);

    this.destroy$.next();
    this.destroy$.complete();
  }
}
