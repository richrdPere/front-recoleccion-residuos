import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Service
import { CiudadanosService } from '../../services/ciudadanos.service';

// Interfaces
import { CiudadanoListadoItem, CiudadanosPaginadosFilters, EstadoCiudadano, OrigenRegistroCiudadano } from '../../interfaces/get-ciudadanos-paginados.interface';

@Component({
  selector: 'app-ciudadanos-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UppercaseDirective,
  ],
  templateUrl: './ciudadanos-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class CiudadanosPageComponent implements OnInit, OnDestroy {
  // ==========================================================
  // LISTADO
  // ==========================================================
  ciudadanos: CiudadanoListadoItem[] = [];

  isLoading = false;
  errorMensaje = '';
  searchTimeout: any;

  // ==========================================================
  // FILTROS
  // ==========================================================
  searchBusqueda = '';
  estadoBusqueda: EstadoCiudadano | '' = '';
  origenBusqueda: OrigenRegistroCiudadano | '' = '';

  readonly estados: { value: EstadoCiudadano, label: string }[] = [
    {
      value: 'PENDIENTE',
      label: 'PENDIENTE'
    },
    {
      value: 'ACTIVO',
      label: 'ACTIVO'
    },
    {
      value: 'SUSPENDIDO',
      label: 'SUSPENDIDO'
    },
    {
      value: 'INACTIVO',
      label: 'INACTIVO'
    },

  ];

  readonly origenes: { value: OrigenRegistroCiudadano, label: string }[] = [
    {
      value: 'WEB',
      label: 'WEB'
    },
    {
      value: 'APP',
      label: 'APP'
    },
    {
      value: 'QR',
      label: 'QR'
    },
    {
      value: 'ADMINISTRATIVO',
      label: 'ADMINISTRATIVO'
    },
  ];

  private filtrosAplicados: CiudadanosPaginadosFilters = {};

  // ==========================================================
  // PAGINACIÓN
  // ==========================================================
  page = 1;
  currentPage = 1;
  limit = 5;

  totalItems = 0;
  totalPages = 0;

  readonly pageSizeOptions = [5, 10, 20, 50];

  private consulta?: Subscription;
  private destruido = false;

  constructor(
    private readonly ciudadanosService: CiudadanosService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // this.buscar();
    this.getCiudadanosPaginated();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consulta?.unsubscribe();
  }

  // ==========================================================
  // CONSULTAS
  // ==========================================================
  getCiudadanosPaginated(): void {

    const params: CiudadanosPaginadosFilters = {
      page: this.page,
      limit: this.limit,
      search: this.searchBusqueda,
      estado_ciudadano: this.estadoBusqueda || undefined,
      origen_registro: this.origenBusqueda || undefined,
    }

    this.consulta?.unsubscribe();

    this.isLoading = true;
    this.errorMensaje = '';

    this.ciudadanos = [];
    this.totalItems = 0;
    this.totalPages = 0;

    this.cdr.markForCheck();

    this.consulta = this.ciudadanosService
      .getCiudadanosPaginados(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: response => {
          if (!response.success || !response.data) {
            this.errorMensaje = response.message ||
              'No se pudieron consultar los ciudadanos.';

            return;
          }

          const data = response.data;

          this.ciudadanos = data.items;

          this.page = data.pagination.page;
          this.currentPage = data.pagination.page;
          this.limit = data.pagination.limit;

          this.totalItems = data.pagination.total;
          this.totalPages = data.pagination.total_pages;
        },

        error: (error: unknown) => {
          this.errorMensaje = this.obtenerMensajeError(
            error,
            'No se pudieron consultar los ciudadanos.',
          );
        },
      });
  }


  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getCiudadanosPaginated();
    }, 300);
  }

  // ==========================================================
  // FILTROS Y PAGINACIÓN
  // ==========================================================
  get hayFiltros(): boolean {
    return !!(
      this.searchBusqueda.trim() ||
      this.estadoBusqueda ||
      this.origenBusqueda
    );
  }

  limpiarFiltros(): void {
    this.searchBusqueda = '';
    this.estadoBusqueda = '';
    this.origenBusqueda = '';

    this.getCiudadanosPaginated();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;

    this.getCiudadanosPaginated();
  }

  cambiarLimite(): void {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getCiudadanosPaginated();
  }

  get registroDesde(): number {
    return this.totalItems === 0
      ? 0
      : (this.page - 1) * this.limit + 1;
  }

  get registroHasta(): number {
    return Math.min(
      this.page * this.limit,
      this.totalItems,
    );
  }

  // ==========================================================
  // PRESENTACIÓN
  // ==========================================================
  nombreCompleto(ciudadano: CiudadanoListadoItem): string {
    return [
      ciudadano.nombres,
      ciudadano.apellidos,
    ]
      .filter(Boolean)
      .join(' ') || 'Datos personales no disponibles';
  }

  getEstadoBadge(estado: EstadoCiudadano): string {
    switch (estado) {
      case 'ACTIVO':
        return 'badge-success';

      case 'PENDIENTE':
        return 'badge-warning';

      case 'SUSPENDIDO':
        return 'badge-error';

      default:
        return 'badge-neutral';
    }
  }

  formatearEtiqueta(valor: string): string {
    if (valor === 'QR' || valor === 'APP') {
      return valor;
    }

    const texto = valor
      .replace(/_/g, ' ')
    // .toLocaleLowerCase('es-PE');

    return texto.charAt(0).toLocaleUpperCase('es-PE') +
      texto.slice(1);
  }

  private obtenerMensajeError(
    error: unknown,
    respaldo: string,
  ): string {
    const texto = (valor: unknown): string | null =>
      typeof valor === 'string' && valor.trim()
        ? valor.trim()
        : null;

    const mensajeDe = (valor: unknown): string | null =>
      valor && typeof valor === 'object'
        ? texto((valor as { message?: unknown }).message)
        : null;

    if (!error || typeof error !== 'object') {
      return texto(error) ?? respaldo;
    }

    const objeto = error as {
      details?: unknown;
      error?: unknown;
      message?: unknown;
    };

    return mensajeDe(objeto.details) ??
      mensajeDe(objeto.error) ??
      texto(objeto.message) ??
      texto(objeto.error) ??
      respaldo;
  }
}
