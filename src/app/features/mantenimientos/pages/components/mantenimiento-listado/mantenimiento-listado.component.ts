import { CommonModule, DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
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
import { EstadoMantenimiento, MantenimientoDetalleData, MantenimientoIdentificador, MantenimientoPaginadoItem, MantenimientosPaginadosFilters, TipoMantenimiento } from '../../../interfaces';
import { VehiculoSelectorItem } from 'src/app/features/vehiculos/models';

// Componentes
import { MantenimientoFormComponent } from '../mantenimiento-form/mantenimiento-form.component';
import { MantenimientoViewComponent } from '../mantenimiento-view/mantenimiento-view.component';
import { IniciarMantenimientoComponent } from '../iniciar-mantenimiento/iniciar-mantenimiento.component';
import { FinalizarMantenimientoComponent } from '../finalizar-mantenimiento/finalizar-mantenimiento.component';
import { CancelarMantenimientoComponent } from '../cancelar-mantenimiento/cancelar-mantenimiento.component';

@Component({
  selector: 'mantenimiento-listado',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
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
export class MantenimientoListadoComponent
  implements OnInit, OnChanges, OnDestroy {

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
  // SUSCRIPCIONES
  // *********************************************************
  private readonly destroy$ = new Subject<void>();
  private listadoSubscription?: Subscription;

  private searchTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly mantenimientoService: MantenimientoService,
    private readonly vehiculosService: VehiculosService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // *********************************************************
  // 1. INICIALIZAR SELECTOR DEL FORMULARIO
  // *********************************************************
  ngOnInit(): void {
    this.initVehiculosDisponibles();
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

// import { CommonModule, DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
// import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { finalize } from 'rxjs';
// import Swal from 'sweetalert2';

// // Directives
// import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// // Service
// import { MantenimientoService } from '../../../services/mantenimiento.service';
// import { VehiculosService } from 'src/app/features/vehiculos/services/vehiculos.service';

// // Interfaces
// import { EstadoMantenimiento, MantenimientoDetalleData, MantenimientoPaginadoItem, MantenimientosPaginadosFilters, TipoMantenimiento } from '../../../interfaces';
// import { VehiculoSelectorItem } from 'src/app/features/vehiculos/models';

// // Componentes
// import { MantenimientoFormComponent } from '../mantenimiento-form/mantenimiento-form.component';
// import { MantenimientoViewComponent } from '../mantenimiento-view/mantenimiento-view.component';
// import { IniciarMantenimientoComponent } from '../iniciar-mantenimiento/iniciar-mantenimiento.component';
// import { FinalizarMantenimientoComponent } from '../finalizar-mantenimiento/finalizar-mantenimiento.component';
// import { CancelarMantenimientoComponent } from '../cancelar-mantenimiento/cancelar-mantenimiento.component';


// @Component({
//   selector: 'mantenimiento-listado',
//   imports: [CurrencyPipe,
//     DatePipe,
//     DecimalPipe,
//     FormsModule,
//     CommonModule,
//     UppercaseDirective,
//     MantenimientoFormComponent,
//     MantenimientoViewComponent,
//     IniciarMantenimientoComponent,
//     FinalizarMantenimientoComponent,
//     CancelarMantenimientoComponent
//   ],
//   templateUrl: './mantenimiento-listado.component.html',
//   styles: ``,
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class MantenimientoListadoComponent {


//   // Mantenimiento
//   mantenimientos: MantenimientoPaginadoItem[] = [];
//   mantenimiento_id: number | null = null;
//   isLoading = true;

//   mostrarModal = false;
//   mostrarModalView = false;
//   modoEdicion = false;
//   mantenimientoSeleccionado: any = null;

//   mostrarModalInicio = false;
//   mantenimientoParaIniciar: MantenimientoPaginadoItem | null = null;

//   mostrarModalFinalizacion = false;
//   mantenimientoParaFinalizar: MantenimientoPaginadoItem | null = null;

//   mostrarModalCancelacion = false;
//   mantenimientoParaCancelar: MantenimientoPaginadoItem | null = null;

//   searchTimeout: any;

//   // Search
//   searchBusqueda: string = '';
//   tipoMantenimientoBusqueda: TipoMantenimiento | '' = '';
//   estadoMantenimientoBusqueda: EstadoMantenimiento | '' = '';

//   // Paginado
//   page = 1;
//   limit = 5;
//   totalItems = 0;
//   totalPages = 0;
//   currentPage = 1;

//   pageSizeOptions = [5, 10, 20, 50];

//   // Estado switch

//   // Selectores
//   vehiculosDisponibles: VehiculoSelectorItem[] = [];

//   readonly tipoMantenimiento: {
//     value: TipoMantenimiento;
//     label: string;
//   }[] = [
//       {
//         value: 'PREVENTIVO',
//         label: 'Preventivo',
//       },
//       {
//         value: 'CORRECTIVO',
//         label: 'Correctivo',
//       },
//     ];

//   readonly estadoMantenimiento: {
//     value: EstadoMantenimiento;
//     label: string;
//   }[] = [
//       {
//         value: 'PROGRAMADO',
//         label: 'Programado',
//       },
//       {
//         value: 'EN_PROCESO',
//         label: 'En proceso',
//       },
//       {
//         value: 'FINALIZADO',
//         label: 'Finalizado',
//       },
//       {
//         value: 'CANCELADO',
//         label: 'Cancelado',
//       },
//     ];

//   constructor(
//     private mantenimientoService: MantenimientoService,
//     private vehiculosService: VehiculosService,
//     private cdr: ChangeDetectorRef,
//   ) { }

//   ngOnInit(): void {
//     this.getMantenimientoPaginated();
//     this.initVehiculosDisponibles();
//   }

//   // ================================
//   // Methods
//   // ================================

//   // - Obtener mantenimientos
//   getMantenimientoPaginated() {
//     const params: MantenimientosPaginadosFilters = {
//       page: this.page,
//       limit: this.limit,
//       search: this.searchBusqueda,
//       tipo_mantenimiento: this.tipoMantenimientoBusqueda || undefined,
//       estado_mantenimiento: this.estadoMantenimientoBusqueda || undefined,
//     };

//     this.isLoading = true;

//     this.mantenimientoService.getMantenimientosPaginated(params)
//       .pipe(
//         finalize(() => {
//           this.isLoading = false;
//           this.cdr.markForCheck();
//         }),
//       )
//       .subscribe({
//         next: (res) => {

//           const items = res.data.items;
//           const paginacion = res.data.pagination;

//           this.mantenimientos = items;
//           this.totalItems = paginacion.total;
//           this.currentPage = paginacion.page;

//           this.page = paginacion.page;
//           this.limit = paginacion.limit;
//           this.totalPages = paginacion.total_pages;
//         },
//         error: (err) => {
//           console.error(err);
//           this.isLoading = false;

//           this.mantenimientos = [];
//           this.totalItems = 0;
//           this.totalPages = 0;
//         }
//       });
//   }

//   initVehiculosDisponibles(): void {
//     this.vehiculosService.getVehiculoSelector().subscribe({
//       next: (response) => {
//         this.vehiculosDisponibles = response.success
//           ? response.data
//           : [];

//         this.cdr.markForCheck();
//       },

//       error: (error) => {
//         this.vehiculosDisponibles = [];
//         this.cdr.markForCheck();

//         void Swal.fire({
//           icon: 'error',
//           title: 'No se pudieron cargar los vehiculos',
//           text: error?.error?.message ??
//             error?.message ??
//             'Intenta nuevamente.',
//         });
//       },
//     });
//   }

//   // Finalizar mantenimiento
//   finalizarMantenimiento(mant: MantenimientoPaginadoItem) {
//     if (mant.estado_mantenimiento !== 'EN_PROCESO') {
//       return;
//     }

//     this.mantenimientoParaFinalizar = mant;
//     this.mostrarModalFinalizacion = true;
//   }

//   // Cancelar mantenimiento
//   cancelarMantenimiento(mant: MantenimientoPaginadoItem) {
//     if (mant.estado_mantenimiento !== 'PROGRAMADO') {
//       return;
//     }

//     this.mantenimientoParaCancelar = mant;
//     this.mostrarModalCancelacion = true;
//   }

//   // - Iniciar mantenimiento
//   iniciarMantenimiento(mant: MantenimientoPaginadoItem) {
//     if (mant.estado_mantenimiento !== 'PROGRAMADO') {
//       return;
//     }

//     this.mantenimientoParaIniciar = mant;
//     this.mostrarModalInicio = true;
//   }

//   // - Editar mantenimiento
//   editarMantenimiento(mant: MantenimientoPaginadoItem) {
//     this.modoEdicion = true;
//     this.mantenimientoSeleccionado = { ...mant };
//     this.mostrarModal = true;
//   }

//   // - Ver mantenimiento
//   verMantenimiento(mant: MantenimientoPaginadoItem) {
//     this.mantenimiento_id = mant.id_mantenimiento;
//     this.mostrarModalView = true;
//   }

//   // ================================
//   // Helpers methods
//   // ================================
//   limpiarFiltros(): void {
//     this.searchBusqueda = '';
//     this.tipoMantenimientoBusqueda = '';
//     this.estadoMantenimientoBusqueda = '';
//     this.page = 1;

//     this.getMantenimientoPaginated();
//   }

//   onSearchChange() {
//     clearTimeout(this.searchTimeout);

//     this.searchTimeout = setTimeout(() => {
//       this.page = 1;
//       this.getMantenimientoPaginated();
//     }, 300);
//   }

//   onPageSizeChange() {
//     this.currentPage = 1; // vuelve a la primera página
//   }

//   onFiltroChange() {
//     this.page = 1;
//     this.getMantenimientoPaginated();
//   }

//   cambiarPagina(nuevaPagina: number) {
//     if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
//     this.page = nuevaPagina;
//     this.getMantenimientoPaginated();
//   }

//   cambiarLimite() {
//     this.limit = Number(this.limit);
//     this.page = 1;
//     this.getMantenimientoPaginated();
//   }

//   // ================================
//   // Modales methods
//   // ================================
//   abrirModal() {
//     this.modoEdicion = false;
//     this.mantenimientoSeleccionado = null;
//     this.mostrarModal = true;
//   }

//   cerrarModal() {
//     this.mostrarModal = false;
//   }

//   cerrarModalInfo() {
//     this.mostrarModalView = false;
//     this.mantenimiento_id = null;
//   }

//   cerrarModalInicio(): void {
//     this.mostrarModalInicio = false;
//     this.mantenimientoParaIniciar = null;
//   }

//   onMantenimientoIniciado(mantenimiento: MantenimientoDetalleData): void {
//     // Reemplaza por el nombre real de tu método de recarga.
//     this.getMantenimientoPaginated();
//   }

//   cerrarModalFinalizacion(): void {
//     this.mostrarModalFinalizacion = false;
//     this.mantenimientoParaFinalizar = null;
//   }

//   onMantenimientoFinalizado(
//     _mantenimiento: MantenimientoDetalleData,
//   ): void {
//     // Sustituye por el nombre real de tu método de recarga.
//     this.getMantenimientoPaginated();
//   }

//   cerrarModalCancelacion(): void {
//     this.mostrarModalCancelacion = false;
//     this.mantenimientoParaCancelar = null;
//   }

//   onMantenimientoCancelado(): void {
//     // Ajusta al nombre de tu método de recarga.
//     this.getMantenimientoPaginated();
//   }
// }
