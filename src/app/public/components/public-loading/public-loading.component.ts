import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

@Component({
  selector: 'app-public-loading',
  standalone: true,
  templateUrl: './public-loading.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLoadingComponent {
  @Input() titulo = 'Consultando información';
  @Input() mensaje = 'Estamos obteniendo los datos del servicio de recolección.';
}
