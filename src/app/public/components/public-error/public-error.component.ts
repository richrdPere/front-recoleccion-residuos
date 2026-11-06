import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-public-error',
  standalone: true,
  templateUrl: './public-error.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicErrorComponent {
  @Input() titulo = 'No pudimos consultar el servicio';
  @Input() mensaje =
    'Revisa tu conexión a internet y vuelve a intentarlo.';

  @Input() permitirReintento = true;
  @Input() reintentando = false;

  @Output() reintentar = new EventEmitter<void>();
}
