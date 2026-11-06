import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

@Component({
  selector: 'app-public-page-header',
  standalone: true,
  templateUrl: './public-page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPageHeaderComponent {
  @Input() titulo = '';
  @Input() descripcion = '';
  @Input() etiqueta = 'Consulta ciudadana';
  @Input() icono = 'fa-solid fa-qrcode';
}
