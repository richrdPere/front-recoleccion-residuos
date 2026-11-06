import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

export interface HorarioPublicoVista {
  id: string;
  dias: string;
  horaInicio: string;
  horaFin: string;
  detalle?: string;
}

@Component({
  selector: 'app-schedule-card',
  standalone: true,
  templateUrl: './schedule-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleCardComponent {
  @Input() horarios: readonly HorarioPublicoVista[] = [];
}
