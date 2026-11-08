import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';

// Interfaces
import { AuditoriaEntidadData, AuditoriaEntidadFilters, AuditoriaId } from '../../../interfaces';

export interface AuditoriaEntidadSeleccionada {
  tipoEntidad: string;
  idEntidad: AuditoriaId;
}

@Component({
  selector: 'auditoria-entidad',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './auditoria-entidad.component.html',
})
export class AuditoriaEntidadComponent implements OnChanges, AfterViewInit, OnDestroy {

  // *********************************************************
  // INPUTS
  // *********************************************************

  @Input() abierto = false;
  @Input() entidad: AuditoriaEntidadSeleccionada | null = null;
  @Input({ required: true }) filtros!: AuditoriaEntidadFilters;
  @Input() datos: AuditoriaEntidadData | null = null;
  @Input() cargando = false;
  @Input() error = '';
  @Input() filtrosModificados = false;

  // *********************************************************
  // OUTPUTS
  // *********************************************************

  @Output() cerrar = new EventEmitter<void>();
  @Output() filtrosChange = new EventEmitter<AuditoriaEntidadFilters>();
  @Output() consultar = new EventEmitter<AuditoriaEntidadFilters>();
  @Output() cambiarPagina = new EventEmitter<number>();
  @Output() verDetalle = new EventEmitter<AuditoriaId>();

  // *********************************************************
  // MODAL
  // *********************************************************

  @ViewChild('modal')
  private modal?: ElementRef<HTMLDialogElement>;

  readonly resultados = [
    'EXITOSO',
    'RECHAZADO',
    'FALLIDO',
  ] as const;

  readonly limites = [10, 20, 50, 100];

  ngOnChanges(): void {
    this.sincronizarModal();
  }

  ngAfterViewInit(): void {
    this.sincronizarModal();
  }

  ngOnDestroy(): void {
    this.modal?.nativeElement.close();
  }

  private sincronizarModal(): void {
    const modal = this.modal?.nativeElement;

    if (!modal) return;

    if (this.abierto && !modal.open) {
      modal.showModal();
    } else if (!this.abierto && modal.open) {
      modal.close();
    }
  }

  solicitarCierre(evento?: Event): void {
    evento?.preventDefault();
    this.cerrar.emit();
  }

  // *********************************************************
  // FILTROS
  // *********************************************************

  actualizarFiltro<K extends keyof AuditoriaEntidadFilters>(
    campo: K,
    valor: AuditoriaEntidadFilters[K],
  ): void {
    if (this.cargando) return;

    this.filtrosChange.emit({
      ...this.filtros,
      [campo]: valor,
      page: 1,
    });
  }

  solicitarConsulta(formularioValido: boolean): void {
    if (
      this.cargando ||
      !this.entidad ||
      !formularioValido
    ) return;

    this.consultar.emit({
      ...this.filtros,
      page: 1,
    });
  }

  solicitarPagina(pagina: number): void {
    if (
      this.cargando ||
      this.filtrosModificados ||
      !this.datos ||
      !Number.isInteger(pagina) ||
      pagina < 1 ||
      pagina > this.datos.pagination.total_pages
    ) return;

    this.cambiarPagina.emit(pagina);
  }

  // *********************************************************
  // PAGINACIÓN
  // *********************************************************

  get desde(): number {
    const paginacion = this.datos?.pagination;

    return paginacion?.total
      ? (paginacion.page - 1) * paginacion.limit + 1
      : 0;
  }

  get hasta(): number {
    const paginacion = this.datos?.pagination;

    return paginacion
      ? Math.min(
        paginacion.page * paginacion.limit,
        paginacion.total,
      )
      : 0;
  }

  // *********************************************************
  // PRESENTACIÓN
  // *********************************************************

  etiqueta(valor: string): string {
    const texto = valor.replace(/_/g, ' ').toLowerCase();

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  claseResultado(resultado: string): string {
    switch (resultado) {
      case 'EXITOSO':
        return 'badge-success badge-outline';

      case 'RECHAZADO':
        return 'badge-warning badge-outline';

      case 'FALLIDO':
        return 'badge-error badge-outline';

      default:
        return 'badge-outline';
    }
  }
}
