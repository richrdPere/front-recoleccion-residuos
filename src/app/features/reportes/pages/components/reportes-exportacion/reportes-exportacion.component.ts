import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interfaces
import { ReporteFormatoExportacion } from '../../../interfaces';

// *********************************************************
// CONTRATO DEL COMPONENTE
// *********************************************************

export interface ReporteExportacionColumnaVista {
  key: string;
  titulo: string;
  seleccionada: boolean;
}

@Component({
  selector: 'reportes-exportacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './reportes-exportacion.component.html',
})
export class ReportesExportacionComponent {

  // *********************************************************
  // INPUTS
  // *********************************************************

  @Input()
  columnas: readonly ReporteExportacionColumnaVista[] = [];

  @Input()
  formato: ReporteFormatoExportacion = 'xlsx';

  @Input()
  mostrarColumnas = true;

  @Input()
  cargando = false;

  @Input()
  exportando = false;

  @Input()
  puedeExportar = false;

  @Input()
  filtrosModificados = false;

  // *********************************************************
  // OUTPUTS
  // *********************************************************

  @Output()
  columnasChange = new EventEmitter<ReporteExportacionColumnaVista[]>();

  @Output()
  formatoChange = new EventEmitter<ReporteFormatoExportacion>();

  @Output()
  exportar = new EventEmitter<void>();

  // *********************************************************
  // OPCIONES
  // *********************************************************

  readonly formatos: {
    value: ReporteFormatoExportacion;
    label: string;
  }[] = [
      {
        value: 'xlsx',
        label: 'Excel (.xlsx)',
      },
      {
        value: 'csv',
        label: 'CSV (.csv)',
      },
      {
        value: 'pdf',
        label: 'PDF (.pdf)',
      },
    ];

  // *********************************************************
  // PROPIEDADES CALCULADAS
  // *********************************************************

  get bloqueado(): boolean {
    return this.cargando || this.exportando;
  }

  get cantidadSeleccionadas(): number {
    return this.columnas.filter(
      columna => columna.seleccionada,
    ).length;
  }

  get sinColumnas(): boolean {
    return (
      this.mostrarColumnas &&
      this.cantidadSeleccionadas === 0
    );
  }

  get descargaDeshabilitada(): boolean {
    return (
      this.bloqueado ||
      !this.puedeExportar ||
      this.filtrosModificados ||
      this.sinColumnas
    );
  }

  // *********************************************************
  // SELECCIÓN DE COLUMNAS
  // *********************************************************

  cambiarColumna(
    key: string,
    seleccionada: boolean,
  ): void {
    if (this.bloqueado) {
      return;
    }

    this.columnasChange.emit(
      this.columnas.map(columna => ({
        ...columna,
        seleccionada:
          columna.key === key
            ? seleccionada
            : columna.seleccionada,
      })),
    );
  }

  seleccionarTodas(seleccionada: boolean): void {
    if (this.bloqueado) {
      return;
    }

    this.columnasChange.emit(
      this.columnas.map(columna => ({
        ...columna,
        seleccionada,
      })),
    );
  }

  // *********************************************************
  // FORMATO Y EXPORTACIÓN
  // *********************************************************

  cambiarFormato(
    formato: ReporteFormatoExportacion,
  ): void {
    if (
      this.bloqueado ||
      !this.formatos.some(item => item.value === formato)
    ) {
      return;
    }

    this.formatoChange.emit(formato);
  }

  solicitarExportacion(): void {
    if (this.descargaDeshabilitada) {
      return;
    }

    this.exportar.emit();
  }

  // *********************************************************
  // PRESENTACIÓN
  // *********************************************************

  tituloColumna(
    columna: ReporteExportacionColumnaVista,
  ): string {
    const texto = columna.titulo.replace(/_/g, ' ');

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
