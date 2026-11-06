import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

export type EstadoRutaPublica =
  | 'DESCONOCIDO'
  | 'SIN_SERVICIO_ACTIVO'
  | 'EN_CURSO'
  | 'PAUSADO'
  | 'FINALIZADO'
  | 'CANCELADO';

const PRESENTACION_ESTADO: Record<
  EstadoRutaPublica,
  {
    etiqueta: string;
    icono: string;
    clase: string;
    mensaje: string;
  }
> = {
  DESCONOCIDO: {
    etiqueta: 'Estado no disponible',
    icono: 'fa-solid fa-circle-question',
    clase: 'bg-base-200 text-base-content/65',
    mensaje: 'Todavía no se pudo confirmar el estado de esta ruta.',
  },
  SIN_SERVICIO_ACTIVO: {
    etiqueta: 'Sin recorrido activo',
    icono: 'fa-solid fa-truck',
    clase: 'bg-base-200 text-base-content/65',
    mensaje: 'Actualmente no hay un vehículo realizando esta ruta.',
  },
  EN_CURSO: {
    etiqueta: 'En curso',
    icono: 'fa-solid fa-truck',
    clase: 'bg-success/10 text-success',
    mensaje: 'El vehículo está realizando el recorrido de recolección.',
  },
  PAUSADO: {
    etiqueta: 'Pausado',
    icono: 'fa-solid fa-pause',
    clase: 'bg-warning/10 text-warning',
    mensaje: 'El recorrido se encuentra temporalmente pausado.',
  },
  FINALIZADO: {
    etiqueta: 'Finalizado',
    icono: 'fa-solid fa-circle-check',
    clase: 'bg-info/10 text-info',
    mensaje: 'El recorrido de recolección ha finalizado.',
  },
  CANCELADO: {
    etiqueta: 'Cancelado',
    icono: 'fa-solid fa-circle-xmark',
    clase: 'bg-error/10 text-error',
    mensaje: 'El recorrido ha sido cancelado.',
  },
};

@Component({
  selector: 'app-route-status-card',
  standalone: true,
  templateUrl: './route-status-card.component.html' ,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteStatusCardComponent {
  @Input() nombreRuta = '';
  @Input() estado: EstadoRutaPublica = 'DESCONOCIDO';
  @Input() mensaje = '';
  @Input() incidenciaPublica = '';

  get presentacion() {
    return PRESENTACION_ESTADO[this.estado]
      ?? PRESENTACION_ESTADO.DESCONOCIDO;
  }
}
