import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';

// Interfaces
import { AuditoriaCambios, AuditoriaDetalleData, AuditoriaDetalleCompletoData, AuditoriaEventoCompleto, AuditoriaValorCambio } from '../../../interfaces';



interface CambioVista {
  campo: string;
  anterior: AuditoriaValorCambio;
  posterior: AuditoriaValorCambio;
}

@Component({
  selector: 'auditoria-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auditoria-detalle.component.html',
})
export class AuditoriaDetalleComponent
  implements OnChanges, AfterViewInit, OnDestroy {

  // *********************************************************
  // INPUTS
  // *********************************************************

  @Input() abierto = false;
  @Input() datos: AuditoriaDetalleData | null = null;
  @Input() cargando = false;
  @Input() error = '';

  // *********************************************************
  // OUTPUTS
  // *********************************************************

  @Output() cerrar = new EventEmitter<void>();
  @Output() reintentar = new EventEmitter<void>();

  // *********************************************************
  // MODAL
  // *********************************************************

  @ViewChild('modal')
  private modal?: ElementRef<HTMLDialogElement>;

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
  // IDENTIFICAR DETALLE CON ACCESO COMPLETO
  // *********************************************************

  private esDetalleCompleto(
    datos: AuditoriaDetalleData | null,
  ): datos is AuditoriaDetalleCompletoData {
    return datos?.metadata.alcance === 'COMPLETO';
  }

  // *********************************************************
  // INFORMACIÓN AUTORIZADA
  // *********************************************************

  get eventoCompleto(): AuditoriaEventoCompleto | null {
    const datos = this.datos;

    return this.esDetalleCompleto(datos)
      ? datos.evento
      : null;
  }

  get cambios(): CambioVista[] {
    const cambios: AuditoriaCambios | null =
      this.eventoCompleto?.cambios ?? null;

    return Object.entries(cambios ?? {}).map(
      ([campo, valores]) => ({
        campo,
        anterior: valores.anterior,
        posterior: valores.posterior,
      }),
    );
  }

  // *********************************************************
  // PRESENTACIÓN
  // *********************************************************

  etiqueta(valor: string | null | undefined): string {
    if (!valor) return 'Sin registrar';

    const texto = valor.replace(/_/g, ' ').toLowerCase();

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  formatearValor(valor: AuditoriaValorCambio): string {
    if (valor === null) return 'Sin valor';

    if (Array.isArray(valor)) {
      return JSON.stringify(valor);
    }

    if (typeof valor === 'boolean') {
      return valor ? 'Sí' : 'No';
    }

    if (valor === '') return '(Texto vacío)';

    return String(valor);
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
