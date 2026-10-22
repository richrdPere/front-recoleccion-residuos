import { CommonModule, Location, DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, finalize, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Services
import { MantenimientoService } from '../../../services/mantenimiento.service';

import { VehiculosService } from 'src/app/features/vehiculos/services/vehiculos.service';

// Interfaces
import { EstadoMantenimiento, MantenimientoDetalleData, MantenimientoIdentificador, MantenimientoPaginadoItem, MantenimientosPaginadosFilters, TipoMantenimiento, VehiculoExpedienteData } from '../../../interfaces';
import { VehiculoSelectorItem } from 'src/app/features/vehiculos/models';

// Componentes
import { MantenimientoFormComponent } from '../mantenimiento-form/mantenimiento-form.component';
import { MantenimientoViewComponent } from '../mantenimiento-view/mantenimiento-view.component';
import { IniciarMantenimientoComponent } from '../iniciar-mantenimiento/iniciar-mantenimiento.component';
import { FinalizarMantenimientoComponent } from '../finalizar-mantenimiento/finalizar-mantenimiento.component';
import { CancelarMantenimientoComponent } from '../cancelar-mantenimiento/cancelar-mantenimiento.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'mantenimiento-listado',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    // DecimalPipe,
    FormsModule,
    CommonModule,
    UppercaseDirective,
    MantenimientoFormComponent,
    MantenimientoViewComponent,
    IniciarMantenimientoComponent,
    FinalizarMantenimientoComponent,
    CancelarMantenimientoComponent,
  ],
  templateUrl: './mantenimiento-listado.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MantenimientoListadoComponent implements OnInit, OnChanges, OnDestroy {

  // *********************************************************
  // ENTRADAS Y SALIDAS
  // *********************************************************
  @Input() vehiculo_id: MantenimientoIdentificador | null = null;

  // Permite actualizar las cards del padre después de una operación.
  @Output() mantenimientosActualizados = new EventEmitter<void>();

  // *********************************************************
  // LISTADO
  // *********************************************************
  mantenimientos: MantenimientoPaginadoItem[] = [];
  vehiculo: VehiculoExpedienteData | null = null;

  isLoading = false;
  errorMensaje = '';

  // *********************************************************
  // MODALES INTERNOS
  // *********************************************************
  mantenimiento_id: number | null = null;

  mostrarModal = false;
  mostrarModalView = false;
  modoEdicion = false;

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
  tipoMantenimientoBusqueda: TipoMantenimiento | '' = '';
  estadoMantenimientoBusqueda: EstadoMantenimiento | '' = '';

  // *********************************************************
  // PAGINACIÓN
  // *********************************************************
  page = 1;
  limit = 5;
  currentPage = 1;
  totalItems = 0;
  totalPages = 0;

  readonly pageSizeOptions = [5, 10, 20, 50];

  // *********************************************************
  // SELECTORES
  // *********************************************************
  vehiculosDisponibles: VehiculoSelectorItem[] = [];

  readonly tipoMantenimiento: {
    value: TipoMantenimiento;
    label: string;
  }[] = [
      { value: 'PREVENTIVO', label: 'PREVENTIVO' },
      { value: 'CORRECTIVO', label: 'CORRECTIVO' },
    ];

  readonly estadoMantenimiento: {
    value: EstadoMantenimiento;
    label: string;
  }[] = [
      { value: 'PROGRAMADO', label: 'PROGRAMADO' },
      { value: 'EN_PROCESO', label: 'EN PROCESO' },
      { value: 'FINALIZADO', label: 'FINALIZADO' },
      { value: 'CANCELADO', label: 'CANCELADO' },
    ];

  // *********************************************************
  // SUSCRIPCIONES
  // *********************************************************
  private readonly destroy$ = new Subject<void>();
  private listadoSubscription?: Subscription;

  private searchTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly mantenimientoService: MantenimientoService,
    private readonly vehiculosService: VehiculosService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // *********************************************************
  // 1. INICIALIZAR SELECTOR DEL FORMULARIO
  // *********************************************************
  ngOnInit(): void {
    this.initVehiculosDisponibles();
    this.getDatosNavegacion();
  }

  // *********************************************************
  // 2. RECIBIR O CAMBIAR VEHÍCULO
  // *********************************************************
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['vehiculo_id']) {
      return;
    }

    clearTimeout(this.searchTimeout);
    this.listadoSubscription?.unsubscribe();

    this.cerrarModalesInternos();

    this.searchBusqueda = '';
    this.tipoMantenimientoBusqueda = '';
    this.estadoMantenimientoBusqueda = '';

    this.page = 1;
    this.currentPage = 1;
    this.errorMensaje = '';

    this.limpiarResultados();

    // ngOnChanges también se ejecuta con el primer valor recibido.
    this.getMantenimientoPaginated();
  }

  getDatosNavegacion() {
    const parametro = this.route.snapshot.paramMap.get('vehiculoId');
    const id = parametro ? Number(parametro) : NaN;

    if (!Number.isSafeInteger(id) || id <= 0) {
      void Swal.fire({
        icon: 'error',
        title: 'Identificador inválido',
        text: 'No se pudo identificar el vehículo seleccionado.',
      }).then(() => {
        void this.router.navigate(['/admin', 'mantenimientos']);
      });

      return;
    }

    const state = history.state as {
      vehiculo?: VehiculoExpedienteData;
    } | null;

    const vehiculoRecibido = state?.vehiculo;

    this.vehiculo =
      vehiculoRecibido &&
        String(vehiculoRecibido.id_vehiculo) === String(id)
        ? vehiculoRecibido
        : null;

    this.vehiculo_id = id;
    this.getMantenimientoPaginated();
  }

  volverAlListado(): void {
    /*
     * Regresa al listado anterior y conserva la navegación
     * natural del navegador.
     */
    this.location.back();
  }


  // *********************************************************
  // 3. CONSULTAR MANTENIMIENTOS DEL VEHÍCULO
  // *********************************************************
  getMantenimientoPaginated(): void {
    this.listadoSubscription?.unsubscribe();

    // Nunca consultar el listado general cuando falta el ID.
    if (!this.tieneVehiculoSeleccionado()) {
      this.isLoading = false;
      this.errorMensaje = '';
      this.limpiarResultados();
      this.cdr.markForCheck();
      return;
    }

    const params: MantenimientosPaginadosFilters = {
      id_vehiculo: this.vehiculo_id!,

      page: this.page,
      limit: this.limit,

      search: this.searchBusqueda.trim() || undefined,

      tipo_mantenimiento:
        this.tipoMantenimientoBusqueda || undefined,

      estado_mantenimiento:
        this.estadoMantenimientoBusqueda || undefined,

      sort_by: 'fecha_inicio_programada',
      sort_order: 'DESC',
    };

    this.isLoading = true;
    this.errorMensaje = '';
    this.cdr.markForCheck();

    this.listadoSubscription = this.mantenimientoService
      .getMantenimientosPaginated(params)
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
              'No se pudieron obtener los mantenimientos.';

            this.cdr.markForCheck();
            return;
          }

          const { items, pagination } = response.data;

          // Si una operación deja la página fuera del rango,
          // consultar la última página disponible.
          if (
            pagination.total > 0 &&
            pagination.page > pagination.total_pages
          ) {
            this.page = pagination.total_pages;
            this.currentPage = this.page;
            this.getMantenimientoPaginated();
            return;
          }

          this.mantenimientos = items;

          this.totalItems = pagination.total;
          this.totalPages = pagination.total_pages;

          this.page = pagination.page;
          this.currentPage = pagination.page;
          this.limit = pagination.limit;

          this.cdr.markForCheck();
        },
        error: (error) => {
          this.limpiarResultados();

          this.errorMensaje =
            error?.error?.message ||
            error?.message ||
            'No se pudieron obtener los mantenimientos.';

          this.cdr.markForCheck();

          void Swal.fire({
            icon: 'error',
            title: 'No se pudieron cargar los mantenimientos',
            text: this.errorMensaje,
          });
        },
      });
  }

  tieneVehiculoSeleccionado(): boolean {
    return (
      this.vehiculo_id !== null &&
      this.vehiculo_id !== undefined &&
      String(this.vehiculo_id).trim() !== ''
    );
  }

  private limpiarResultados(): void {
    this.mantenimientos = [];
    this.totalItems = 0;
    this.totalPages = 0;
  }

  // *********************************************************
  // 4. SELECTOR PARA EL FORMULARIO INTERNO
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
  // 5. FILTROS
  // *********************************************************
  limpiarFiltros(): void {
    clearTimeout(this.searchTimeout);

    this.searchBusqueda = '';
    this.tipoMantenimientoBusqueda = '';
    this.estadoMantenimientoBusqueda = '';

    this.page = 1;
    this.currentPage = 1;

    // Conserva siempre el ID del vehículo.
    this.getMantenimientoPaginated();
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.currentPage = 1;
      this.getMantenimientoPaginated();
    }, 300);
  }

  onFiltroChange(): void {
    clearTimeout(this.searchTimeout);

    this.page = 1;
    this.currentPage = 1;

    this.getMantenimientoPaginated();
  }

  get hayFiltros(): boolean {
    return !!(
      this.searchBusqueda.trim() ||
      this.tipoMantenimientoBusqueda ||
      this.estadoMantenimientoBusqueda
    );
  }

  // *********************************************************
  // 6. PAGINACIÓN
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

    this.getMantenimientoPaginated();
  }

  cambiarLimite(): void {
    clearTimeout(this.searchTimeout);

    const nuevoLimite = Number(this.limit);

    this.limit = this.pageSizeOptions.includes(nuevoLimite)
      ? nuevoLimite
      : this.pageSizeOptions[0];

    this.page = 1;
    this.currentPage = 1;

    this.getMantenimientoPaginated();
  }

  onPageSizeChange(): void {
    this.cambiarLimite();
  }

  // *********************************************************
  // 7. ACCIONES
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

  // *********************************************************
  // 8. MODALES INTERNOS
  // *********************************************************
  abrirModal(): void {
    if (!this.tieneVehiculoSeleccionado()) {
      return;
    }

    this.modoEdicion = false;
    this.mantenimientoSeleccionado = null;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.mantenimientoSeleccionado = null;
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

  private cerrarModalesInternos(): void {
    this.cerrarModal();
    this.cerrarModalInfo();
    this.cerrarModalInicio();
    this.cerrarModalFinalizacion();
    this.cerrarModalCancelacion();
  }

  // *********************************************************
  // 9. ACTUALIZAR LISTADO Y EXPEDIENTE DEL PADRE
  // *********************************************************
  onMantenimientoGuardado(): void {
    this.actualizarDespuesDeOperacion();
  }

  onMantenimientoIniciado(
    _mantenimiento: MantenimientoDetalleData,
  ): void {
    this.actualizarDespuesDeOperacion();
  }

  onMantenimientoFinalizado(
    _mantenimiento: MantenimientoDetalleData,
  ): void {
    this.actualizarDespuesDeOperacion();
  }

  onMantenimientoCancelado(): void {
    this.actualizarDespuesDeOperacion();
  }

  private actualizarDespuesDeOperacion(): void {
    clearTimeout(this.searchTimeout);

    this.getMantenimientoPaginated();
    this.mantenimientosActualizados.emit();
  }

  // *********************************************************
  // 10. DESTRUIR
  // *********************************************************
  ngOnDestroy(): void {
    clearTimeout(this.searchTimeout);

    this.destroy$.next();
    this.destroy$.complete();
  }
}
