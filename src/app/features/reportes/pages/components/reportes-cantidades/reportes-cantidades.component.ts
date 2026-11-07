import {  Component,  Input} from '@angular/core';
import { CommonModule } from '@angular/common';

// *********************************************************
// CONTRATO DEL COMPONENTE
// *********************************************************

export interface ReporteCantidadVista {
  unidad_medida: string;
  cantidad_total: string;
  recorridos: number;
}

@Component({
  selector: 'reportes-cantidades',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './reportes-cantidades.component.html',
})
export class ReportesCantidadesComponent {

  // *********************************************************
  // INPUTS
  // *********************************************************

  @Input()
  cantidades: readonly ReporteCantidadVista[] = [];

  @Input()
  cargando = false;

  // *********************************************************
  // PRESENTACIÓN
  // *********************************************************

  nombreUnidad(unidad: string): string {
    switch (unidad) {
      case 'KG':
        return 'Kilogramos';

      case 'TONELADA':
        return 'Toneladas';

      case 'LITRO':
        return 'Litros';

      case 'M3':
        return 'Metros cúbicos';

      default:
        return unidad;
    }
  }

  simboloUnidad(unidad: string): string {
    switch (unidad) {
      case 'KG':
        return 'kg';

      case 'TONELADA':
        return 't';

      case 'LITRO':
        return 'L';

      case 'M3':
        return 'm³';

      default:
        return unidad;
    }
  }

  esVolumen(unidad: string): boolean {
    return unidad === 'LITRO' || unidad === 'M3';
  }
}
