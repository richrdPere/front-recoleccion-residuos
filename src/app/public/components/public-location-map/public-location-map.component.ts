import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import {
  PublicLastUpdateComponent,
} from '../public-last-update/public-last-update.component';

@Component({
  selector: 'app-public-location-map',
  standalone: true,
  imports: [PublicLastUpdateComponent],
  templateUrl: './public-location-map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLocationMapComponent {
  @Input() nombreRuta = '';
  @Input() mapaIntegrado = false;
  @Input() cargando = false;
  @Input() ultimaActualizacion: string | Date | null = null;
  @Input() desactualizada = false;

  @Input() tituloVacio = 'Mapa de la ruta';
  @Input() mensajeVacio =
    'El mapa del recorrido estará disponible cuando se conecte el seguimiento.';

  @Input() mensajeUbicacion = '';

  @Output() actualizar = new EventEmitter<void>();
}
