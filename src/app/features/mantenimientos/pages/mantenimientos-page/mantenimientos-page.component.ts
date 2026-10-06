import { CommonModule, DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Service
import { MantenimientoService } from '../../services/mantenimiento.service';
import { VehiculosService } from 'src/app/features/vehiculos/services/vehiculos.service';

// Interfaces
import { EstadoMantenimiento, MantenimientoPaginadoItem, MantenimientosPaginadosFilters, TipoMantenimiento } from '../../interfaces';
import { VehiculoSelectorItem } from 'src/app/features/vehiculos/models';

// Componentes
import { MantenimientoFormComponent } from '../mantenimiento-form/mantenimiento-form.component';
import { MantenimientoViewComponent } from '../mantenimiento-view/mantenimiento-view.component';

@Component({
  selector: 'app-mantenimientos-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    FormsModule,
    CommonModule,
    UppercaseDirective,
    MantenimientoFormComponent,
    MantenimientoViewComponent
  ],
  templateUrl: './mantenimientos-page.component.html',
  styles: ``,
})
export class MantenimientosPageComponent implements OnInit {


  // Mantenimiento
  mantenimientos: MantenimientoPaginadoItem[] = [];
  mantenimiento_id: number | null = null;
  isLoading = true;

  mostrarModal = false;
  mostrarModalView = false;
  modoEdicion = false;
  mantenimientoSeleccionado: any = null;

  searchTimeout: any;

  // Search
  searchBusqueda: string = '';
  tipoMantenimientoBusqueda: TipoMantenimiento | '' = '';
  estadoMantenimientoBusqueda: EstadoMantenimiento | '' = '';

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  // Estado switch

  // Selectores
  vehiculosDisponibles: VehiculoSelectorItem[] = [];

  readonly tipoMantenimiento: {
    value: TipoMantenimiento;
    label: string;
  }[] = [
      {
        value: 'PREVENTIVO',
        label: 'Preventivo',
      },
      {
        value: 'CORRECTIVO',
        label: 'Correctivo',
      },
    ];

  readonly estadoMantenimiento: {
    value: EstadoMantenimiento;
    label: string;
  }[] = [
      {
        value: 'PROGRAMADO',
        label: 'Programado',
      },
      {
        value: 'EN_PROCESO',
        label: 'En proceso',
      },
      {
        value: 'FINALIZADO',
        label: 'Finalizado',
      },
      {
        value: 'CANCELADO',
        label: 'Cancelado',
      },
    ];

  constructor(
    private mantenimientoService: MantenimientoService,
    private vehiculosService: VehiculosService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.getMantenimientoPaginated();
    this.initVehiculosDisponibles();
  }

  // ================================
  // Methods
  // ================================

  // - Obtener mantenimientos
  getMantenimientoPaginated() {
    const params: MantenimientosPaginadosFilters = {
      page: this.page,
      limit: this.limit,
      search: this.searchBusqueda,
      tipo_mantenimiento: this.tipoMantenimientoBusqueda || undefined,
      estado_mantenimiento: this.estadoMantenimientoBusqueda || undefined,
    };

    this.isLoading = true;

    this.mantenimientoService.getMantenimientosPaginated(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {

          const items = res.data.items;
          const paginacion = res.data.pagination;

          this.mantenimientos = items;
          this.totalItems = paginacion.total;
          this.currentPage = paginacion.page;

          this.page = paginacion.page;
          this.limit = paginacion.limit;
          this.totalPages = paginacion.total_pages;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;

          this.mantenimientos = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      });
  }

  initVehiculosDisponibles(): void {
    this.vehiculosService.getVehiculoSelector().subscribe({
      next: (response) => {
        this.vehiculosDisponibles = response.success
          ? response.data
          : [];

        this.cdr.markForCheck();
      },

      error: (error) => {
        this.vehiculosDisponibles = [];
        this.cdr.markForCheck();

        void Swal.fire({
          icon: 'error',
          title: 'No se pudieron cargar los vehiculos',
          text: error?.error?.message ??
            error?.message ??
            'Intenta nuevamente.',
        });
      },
    });
  }

  // Finalizar mantenimiento
  finalizarMantenimiento(_t151: MantenimientoPaginadoItem) {
    throw new Error('Method not implemented.');
  }

  // Cancelar mantenimiento
  cancelarMantenimiento(_t151: MantenimientoPaginadoItem) {
    throw new Error('Method not implemented.');
  }

  // - Iniciar mantenimiento
  iniciarMantenimiento(_t151: MantenimientoPaginadoItem) {
    throw new Error('Method not implemented.');
  }

  // - Editar mantenimiento
  editarMantenimiento(mant: MantenimientoPaginadoItem) {
    this.modoEdicion = true;
    this.mantenimientoSeleccionado = { ...mant };
    this.mostrarModal = true;
  }

  // - Ver mantenimiento
  verMantenimiento(mant: MantenimientoPaginadoItem) {
    this.mantenimiento_id = mant.id_mantenimiento;
    this.mostrarModalView = true;
  }

  // ================================
  // Helpers methods
  // ================================
  limpiarFiltros(): void {
    this.searchBusqueda = '';
    this.tipoMantenimientoBusqueda = '';
    this.estadoMantenimientoBusqueda = '';
    this.page = 1;

    this.getMantenimientoPaginated();
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getMantenimientoPaginated();
    }, 300);
  }

  onPageSizeChange() {
    this.currentPage = 1; // vuelve a la primera página
  }

  onFiltroChange() {
    this.page = 1;
    this.getMantenimientoPaginated();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.getMantenimientoPaginated();
  }

  cambiarLimite() {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getMantenimientoPaginated();
  }

  // ================================
  // Modales methods
  // ================================
  abrirModal() {
    this.modoEdicion = false;
    this.mantenimientoSeleccionado = null;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  cerrarModalInfo() {
    this.mostrarModalView = false;
    this.mantenimiento_id = null;
  }





}
