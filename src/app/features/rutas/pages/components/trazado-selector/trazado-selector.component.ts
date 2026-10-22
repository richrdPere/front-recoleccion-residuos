import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

type Coordenada = [number, number];

@Component({
  selector: 'ruta-trazado-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trazado-selector.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrazadoSelectorComponent implements OnChanges {
  @Input() coordenadas: Coordenada[] = [];
  @Input() editable = false;
  @Input() deshabilitado = false;
  @Input() seleccionado = -1;
  @Output() ubicacionSeleccionada = new EventEmitter<number>();
  vertices: { indice: number; x: number; y: number }[] = [];
  linea = '';

  ngOnChanges(): void {
    if (!this.coordenadas.length) { this.vertices = []; this.linea = ''; return; }
    const xs = this.coordenadas.map(c => c[0]);
    const ys = this.coordenadas.map(c => c[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const cos = Math.max(0.01, Math.cos((minY + maxY) / 2 * Math.PI / 180));
    const ancho = (maxX - minX) * cos, alto = maxY - minY;
    const escala = Math.min(520 / (ancho || 1e-9), 160 / (alto || 1e-9));
    this.vertices = this.coordenadas.map((c, indice) => ({
      indice,
      x: 40 + (520 - ancho * escala) / 2 + (c[0] - minX) * cos * escala,
      y: 40 + (160 - alto * escala) / 2 + (maxY - c[1]) * escala,
    }));
    this.linea = this.vertices.map(v => v.x + ',' + v.y).join(' ');
  }
  cambiar(event: Event): void { this.elegir(Number((event.target as HTMLSelectElement).value)); }
  elegir(indice: number): void {
    if (this.editable && !this.deshabilitado && Number.isInteger(indice) && indice >= 0 && indice < this.coordenadas.length) {
      this.ubicacionSeleccionada.emit(indice);
    }
  }
}
