import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

export interface RutaPublicaOpcion {
  idRuta: number;
  nombre: string;
  codigo: string;
}

@Component({
  selector: 'app-sector-information-card',
  standalone: true,
  templateUrl: './sector-information-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectorInformationCardComponent {
  @Input() nombre = '';
  @Input() descripcion = '';
  @Input() rutas: readonly RutaPublicaOpcion[] = [];
  @Input() idRutaSeleccionada: number | null = null;
  @Input() cargando = false;

  @Output() rutaSeleccionada = new EventEmitter<number>();

  seleccionar(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);

    if (this.rutas.some((ruta) => ruta.idRuta === id)) {
      this.rutaSeleccionada.emit(id);
    }
  }
}
