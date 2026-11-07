import {  Component,  Input} from '@angular/core';
import { CommonModule } from '@angular/common';

// *********************************************************
// CONTRATOS DEL COMPONENTE
// *********************************************************

export interface ReporteResumenEstadoVista {
  estado: string | null;
  total: number;
}

export interface ReporteResumenTarjetaVista {
  titulo: string;
  total: number;
  estados: readonly ReporteResumenEstadoVista[];
  detalle?: string;
}

@Component({
  selector: 'reportes-resumen',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './reportes-resumen.component.html',
})
export class ReportesResumenComponent {

  // *********************************************************
  // INPUTS
  // *********************************************************

  @Input()
  tarjetas: readonly ReporteResumenTarjetaVista[] = [];

  @Input()
  cargando = false;

  // *********************************************************
  // PRESENTACIÓN
  // *********************************************************

  etiquetaEstado(estado: string | null): string {
    if (!estado) {
      return 'Sin dato';
    }

    const texto = estado
      .replace(/_/g, ' ')
      .toLowerCase();

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  claseEstado(estado: string | null): string {
    switch (estado) {
      case 'FINALIZADA':
      case 'FINALIZADO':
      case 'ATENDIDO':
      case 'RESUELTA':
      case 'DISPONIBLE':
        return 'badge-success badge-outline';

      case 'EN_CURSO':
      case 'EN_RUTA':
      case 'EN_ATENCION':
      case 'EN_PROCESO':
        return 'badge-info badge-outline';

      case 'PENDIENTE':
      case 'PAUSADA':
      case 'PAUSADO':
      case 'REPORTADA':
      case 'EN_REVISION':
      case 'EN_MANTENIMIENTO':
        return 'badge-warning badge-outline';

      case 'CANCELADA':
      case 'CANCELADO':
      case 'RECHAZADA':
      case 'FUERA_DE_SERVICIO':
        return 'badge-error badge-outline';

      default:
        return 'badge-outline';
    }
  }
}
