import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interfaces
export interface ReporteTablaColumna {
  key: string;
  titulo: string;
}

@Component({
  selector: 'reportes-tabla',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './reportes-tabla.component.html',
})
export class ReportesTablaComponent {

  // *********************************************************
  // INPUTS
  // *********************************************************

  @Input()
  columnas: readonly ReporteTablaColumna[] = [];

  @Input()
  items: readonly Record<string, unknown>[] = [];

  @Input()
  cargando = false;

  @Input()
  titulo = 'Registros del reporte';

  // *********************************************************
  // FORMATO DE FECHAS
  // *********************************************************

  private readonly formatoFechaHora = new Intl.DateTimeFormat(
    'es-PE',
    {
      timeZone: 'America/Lima',
      dateStyle: 'short',
      timeStyle: 'short',
      hourCycle: 'h23',
    },
  );

  // *********************************************************
  // ENCABEZADOS
  // *********************************************************

  private readonly titulos: Record<string, string> = {
    id_recorrido: 'Recorrido',
    id_programacion: 'Programación',
    id_vehiculo: 'Vehículo (ID)',
    id_ruta: 'Ruta (ID)',
    id_zona: 'Zona (ID)',
    id_ruta_punto: 'Punto (ID)',
    id_recoleccion: 'Registro de atención',

    id_usuario: 'Responsable (ID)',
    id_usuario_registro: 'Registrado por (ID)',
    id_usuario_reporte: 'Reportado por (ID)',
    id_responsable: 'Responsable (ID)',
    id_usuario_inicio: 'Iniciado por (ID)',
    id_usuario_finalizacion: 'Finalizado por (ID)',
    id_usuario_creacion: 'Creado por (ID)',

    id_incidencia: 'Incidencia',
    id_mantenimiento: 'Mantenimiento',

    fecha_inicio: 'Inicio',
    fecha_fin: 'Finalización',
    fecha_dispositivo: 'Fecha de atención',
    fecha_recepcion: 'Fecha de recepción',
    fecha_medicion: 'Fecha de medición',

    duracion_segundos: 'Duración',
    distancia_recorrida_metros: 'Distancia',

    cantidad_total: 'Cantidad total',
    unidad_medida: 'Unidad',
    resultado_pendiente: 'Resultado final',

    puntos_total: 'Total de puntos',
    puntos_atendidos: 'Puntos atendidos',

    vehiculo_operativo: 'Vehículo operativo',
    costo_total: 'Costo total',
  };

  tituloColumna(columna: ReporteTablaColumna): string {
    const titulo =
      this.titulos[columna.key] ??
      columna.titulo.replace(/_/g, ' ');

    return (
      titulo.charAt(0).toUpperCase() +
      titulo.slice(1)
    );
  }

  // *********************************************************
  // FORMATO DE CELDAS
  // *********************************************************

  formatearCelda(
    fila: Record<string, unknown>,
    key: string,
  ): string {
    const valor = fila[key];

    if (
      valor === null ||
      valor === undefined ||
      valor === ''
    ) {
      return 'Sin registrar';
    }

    if (key === 'resultado_pendiente') {
      return this.formatearIndicador(
        valor,
        'Pendiente',
        'Registrado',
      );
    }

    if (key === 'obligatorio') {
      return this.formatearIndicador(valor, 'Sí', 'No');
    }

    if (key === 'vehiculo_operativo') {
      return this.formatearIndicador(
        valor,
        'Operativo',
        'No operativo',
      );
    }

    const camposEtiqueta = [
      'estado',
      'turno',
      'unidad_medida',
      'tipo',
      'tipo_mantenimiento',
      'prioridad',
      'origen',
    ];

    if (camposEtiqueta.includes(key)) {
      return this.etiqueta(String(valor));
    }

    if (key.startsWith('fecha')) {
      return this.formatearFecha(String(valor));
    }

    if (key === 'duracion_segundos') {
      return this.formatearDuracion(valor);
    }

    if (key === 'distancia_recorrida_metros') {
      return `${String(valor)} m`;
    }

    // Conserva los decimales devueltos como string por MySQL.
    // Los valores 0 se muestran como 0.
    return String(valor);
  }

  private formatearIndicador(
    valor: unknown,
    afirmativo: string,
    negativo: string,
  ): string {
    if (
      valor === true ||
      valor === 1 ||
      valor === '1'
    ) {
      return afirmativo;
    }

    if (
      valor === false ||
      valor === 0 ||
      valor === '0'
    ) {
      return negativo;
    }

    return String(valor);
  }

  private formatearFecha(valor: string): string {
    // Una fecha civil no debe desplazarse de día
    // al aplicar la zona horaria.
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return valor.split('-').reverse().join('/');
    }

    const tieneZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(valor);

    // Los timestamps SQL sin zona se interpretan como UTC,
    // conforme al contrato de fechas de estos reportes.
    const iso = tieneZona
      ? valor.replace(' ', 'T')
      : `${valor.replace(' ', 'T')}Z`;

    const fecha = new Date(iso);

    return Number.isFinite(fecha.getTime())
      ? this.formatoFechaHora.format(fecha)
      : valor;
  }

  private formatearDuracion(valor: unknown): string {
    const segundos = Number(valor);

    if (
      !Number.isFinite(segundos) ||
      segundos < 0
    ) {
      return String(valor);
    }

    const total = Math.floor(segundos);

    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const restantes = total % 60;

    return `${horas} h ${minutos} min ${restantes} s`;
  }

  private etiqueta(valor: string): string {
    const etiquetas: Record<string, string> = {
      MANANA: 'Mañana',
      KG: 'kg',
      TONELADA: 't',
      LITRO: 'L',
      M3: 'm³',
      CRITICA: 'Crítica',
    };

    if (etiquetas[valor]) {
      return etiquetas[valor];
    }

    const texto = valor
      .replace(/_/g, ' ')
      .toLowerCase();

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
