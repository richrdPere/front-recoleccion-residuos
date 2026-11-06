import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-public-last-update',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './public-last-update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLastUpdateComponent {
  @Input() fecha: string | Date | null = null;
  @Input() desactualizada = false;

  get fechaValida(): Date | null {
    if (!this.fecha) return null;

    const fecha = this.fecha instanceof Date
      ? this.fecha
      : new Date(this.fecha);

    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
}
