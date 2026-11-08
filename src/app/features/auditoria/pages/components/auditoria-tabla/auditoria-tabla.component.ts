import { CommonModule } from '@angular/common';
import {  Component,  EventEmitter,  Input,  Output} from '@angular/core';

// Interfaces
import {  AuditoriaId,  AuditoriaListadoItem} from '../../../interfaces';
import type {  AuditoriaEntidadSeleccionada} from '../auditoria-entidad/auditoria-entidad.component';

@Component({
  selector: 'auditoria-tabla',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auditoria-tabla.component.html',
})
export class AuditoriaTablaComponent {

  // *********************************************************
  // INPUTS
  // *********************************************************

  @Input()
  items: readonly AuditoriaListadoItem[] = [];

  @Input()
  cargando = false;

  @Input()
  deshabilitado = false;

  @Input()
  mostrarEntidad = true;

  @Input()
  titulo = 'Eventos de auditoría';

  // *********************************************************
  // OUTPUTS
  // *********************************************************

  @Output()
  verDetalle = new EventEmitter<AuditoriaId>();

  @Output()
  verEntidad = new EventEmitter<AuditoriaEntidadSeleccionada>();

  // *********************************************************
  // ACCIONES
  // *********************************************************

  abrirDetalle(evento: AuditoriaListadoItem): void {
    if (this.cargando || this.deshabilitado) return;

    this.verDetalle.emit(evento.id_auditoria);
  }

  tieneEntidad(evento: AuditoriaListadoItem): boolean {
    return (
      typeof evento.tipo_entidad === 'string' &&
      evento.tipo_entidad.length > 0 &&
      typeof evento.id_entidad === 'string' &&
      evento.id_entidad.length > 0
    );
  }

  abrirEntidad(evento: AuditoriaListadoItem): void {
    if (
      this.cargando ||
      this.deshabilitado ||
      !this.mostrarEntidad ||
      !this.tieneEntidad(evento)
    ) return;

    // Comprobación explícita para estrechar los tipos.
    if (
      evento.tipo_entidad === null ||
      evento.id_entidad === null
    ) return;

    this.verEntidad.emit({
      tipoEntidad: evento.tipo_entidad,
      idEntidad: evento.id_entidad,
    });
  }

  // *********************************************************
  // PRESENTACIÓN
  // *********************************************************

  etiqueta(valor: string): string {
    const etiquetas: Record<string, string> = {
      ANONIMO: 'Anónimo',
      MOVIL: 'Móvil',
      API: 'API',
    };

    if (etiquetas[valor]) return etiquetas[valor];

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
