import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

export type EstadoServicioPublico =
  | 'PENDIENTE'
  | 'EN_CURSO'
  | 'FINALIZADO'
  | 'CANCELADO';

export interface ServicioPublicoVista {
  fechaLabel: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoServicioPublico;
}

@Component({
  selector: 'app-next-collection-card',
  standalone: true,
  templateUrl: './next-collection-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextCollectionCardComponent {
  @Input() servicio: ServicioPublicoVista | null = null;
  @Input() periodoLabel = '';

  get estadoLabel(): string {
    switch (this.servicio?.estado) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EN_CURSO':
        return 'En curso';
      case 'FINALIZADO':
        return 'Finalizado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return '';
    }
  }

  get estadoClase(): string {
    switch (this.servicio?.estado) {
      case 'PENDIENTE':
        return 'bg-info/10 text-info';
      case 'EN_CURSO':
        return 'bg-success/10 text-success';
      case 'FINALIZADO':
        return 'bg-base-200 text-base-content/70';
      case 'CANCELADO':
        return 'bg-error/10 text-error';
      default:
        return '';
    }
  }
}
