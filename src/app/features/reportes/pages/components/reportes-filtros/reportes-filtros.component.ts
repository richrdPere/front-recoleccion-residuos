import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interfaces
import { ReporteTipoExportable } from '../../../interfaces';

// *********************************************************
// CONTRATOS DEL SUBCOMPONENTE
// *********************************************************

export interface ReporteOpcionCatalogo {
  id: number;
  nombre: string;
  id_zona?: number;
}

export interface ReportesFiltrosFormulario {
  tipoReporte: ReporteTipoExportable;

  fechaInicio: string;
  fechaFin: string;

  zonaBusqueda: number | null;
  rutaBusqueda: number | null;
  vehiculoBusqueda: number | null;

  turnoBusqueda: string;
  estadoBusqueda: string;
  unidadBusqueda: string;

  tipoIncidenciaBusqueda: string;
  prioridadBusqueda: string;
  origenBusqueda: string;

  tipoMantenimientoBusqueda: string;
}

@Component({
  selector: 'reportes-filtros',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './reportes-filtros.component.html',
})
export class ReportesFiltrosComponent {

  // *********************************************************
  // INPUTS
  // *********************************************************

  @Input({ required: true })
  filtros!: ReportesFiltrosFormulario;

  @Input()
  zonas: readonly ReporteOpcionCatalogo[] = [];

  @Input()
  rutas: readonly ReporteOpcionCatalogo[] = [];

  @Input()
  vehiculos: readonly ReporteOpcionCatalogo[] = [];

  @Input()
  cargando = false;

  @Input()
  exportando = false;

  @Input()
  catalogosCargando = false;

  @Input()
  erroresCatalogos: readonly string[] = [];

  // *********************************************************
  // OUTPUTS
  // *********************************************************

  @Output()
  filtrosChange =
    new EventEmitter<ReportesFiltrosFormulario>();

  @Output()
  consultar = new EventEmitter<void>();

  @Output()
  restablecer = new EventEmitter<void>();

  @Output()
  recargarCatalogos = new EventEmitter<void>();

  // *********************************************************
  // OPCIONES
  // *********************************************************

  readonly reportes: {
    value: ReporteTipoExportable;
    label: string;
  }[] = [
      {
        value: 'RESUMEN_OPERATIVO',
        label: 'Resumen operativo',
      },
      {
        value: 'PROGRAMACIONES',
        label: 'Programaciones',
      },
      {
        value: 'RECORRIDOS',
        label: 'Recorridos',
      },
      {
        value: 'RECOLECCIONES',
        label: 'Residuos recolectados',
      },
      {
        value: 'ATENCION_PUNTOS',
        label: 'Atención de puntos',
      },
      {
        value: 'INCIDENCIAS',
        label: 'Incidencias',
      },
      {
        value: 'VEHICULOS',
        label: 'Vehículos',
      },
      {
        value: 'MANTENIMIENTOS',
        label: 'Mantenimientos',
      },
      {
        value: 'REPORTES_CIUDADANOS',
        label: 'Incidencias ciudadanas',
      },
    ];

  readonly estados = {
    PROGRAMACIONES: [
      'PROGRAMADA',
      'ASIGNADA',
      'ACEPTADA',
      'EN_CURSO',
      'PAUSADA',
      'FINALIZADA',
      'CANCELADA',
    ],
    RECORRIDOS: [
      'EN_CURSO',
      'PAUSADO',
      'FINALIZADO',
      'CANCELADO',
    ],
    ATENCION_PUNTOS: [
      'ATENDIDO',
      'OMITIDO',
      'PENDIENTE',
    ],
    INCIDENCIAS: [
      'REPORTADA',
      'EN_REVISION',
      'EN_ATENCION',
      'RESUELTA',
      'RECHAZADA',
      'CANCELADA',
    ],
    VEHICULOS: [
      'DISPONIBLE',
      'ASIGNADO',
      'EN_RUTA',
      'EN_MANTENIMIENTO',
      'FUERA_DE_SERVICIO',
    ],
    MANTENIMIENTOS: [
      'PROGRAMADO',
      'EN_PROCESO',
      'FINALIZADO',
      'CANCELADO',
    ],
  } as const;

  readonly turnos = [
    'MANANA',
    'TARDE',
    'NOCHE',
  ] as const;

  readonly unidades = [
    'KG',
    'TONELADA',
    'LITRO',
    'M3',
  ] as const;

  readonly tiposMantenimiento = [
    'PREVENTIVO',
    'CORRECTIVO',
  ] as const;

  readonly prioridades = [
    'BAJA',
    'MEDIA',
    'ALTA',
    'CRITICA',
  ] as const;

  readonly tiposIncidencia = [
    'VIA_BLOQUEADA',
    'AVERIA_VEHICULO',
    'ACCIDENTE',
    'RECOLECCION_NO_REALIZADA',
    'ACUMULACION_RESIDUOS',
    'PUNTO_INACCESIBLE',
    'OTRO',
  ] as const;

  readonly origenes = [
    'APP_OPERATIVA',
    'APP_CIUDADANA',
    'WEB_MUNICIPAL',
    'WEB_CIUDADANA',
  ] as const;

  readonly origenesCiudadanos = [
    'APP_CIUDADANA',
    'WEB_CIUDADANA',
  ] as const;

  // *********************************************************
  // PROPIEDADES CALCULADAS
  // *********************************************************

  get bloqueado(): boolean {
    return this.cargando || this.exportando;
  }

  get admiteZonaRutaTurno(): boolean {
    return this.filtros.tipoReporte !== 'MANTENIMIENTOS';
  }

  get esIncidencia(): boolean {
    return (
      this.filtros.tipoReporte === 'INCIDENCIAS' ||
      this.filtros.tipoReporte === 'REPORTES_CIUDADANOS'
    );
  }

  get estadosDisponibles(): readonly string[] {
    const tipo = this.filtros.tipoReporte;

    if (tipo === 'REPORTES_CIUDADANOS') {
      return this.estados.INCIDENCIAS;
    }

    if (
      tipo === 'RESUMEN_OPERATIVO' ||
      tipo === 'RECOLECCIONES'
    ) {
      return [];
    }

    return this.estados[tipo];
  }

  get origenesDisponibles(): readonly string[] {
    return this.filtros.tipoReporte === 'REPORTES_CIUDADANOS'
      ? this.origenesCiudadanos
      : this.origenes;
  }

  get rutasDisponibles(): readonly ReporteOpcionCatalogo[] {
    const zona = this.filtros.zonaBusqueda;

    return zona === null
      ? this.rutas
      : this.rutas.filter(ruta => ruta.id_zona === zona);
  }

  // *********************************************************
  // CAMBIOS DE FILTROS
  // *********************************************************

  actualizar<K extends keyof ReportesFiltrosFormulario>(
    campo: K,
    valor: ReportesFiltrosFormulario[K],
  ): void {
    if (this.bloqueado) {
      return;
    }

    this.filtrosChange.emit({
      ...this.filtros,
      [campo]: valor,
    });
  }

  cambiarTipo(tipoReporte: ReporteTipoExportable): void {
    if (
      this.bloqueado ||
      tipoReporte === this.filtros.tipoReporte
    ) {
      return;
    }

    // Las fechas se conservan.
    // Los filtros específicos del reporte anterior se limpian.
    this.filtrosChange.emit({
      ...this.filtros,
      tipoReporte,
      zonaBusqueda: null,
      rutaBusqueda: null,
      vehiculoBusqueda: null,
      turnoBusqueda: '',
      estadoBusqueda: '',
      unidadBusqueda: '',
      tipoIncidenciaBusqueda: '',
      prioridadBusqueda: '',
      origenBusqueda: '',
      tipoMantenimientoBusqueda: '',
    });
  }

  cambiarZona(zonaBusqueda: number | null): void {
    if (this.bloqueado) {
      return;
    }

    this.filtrosChange.emit({
      ...this.filtros,
      zonaBusqueda,
      rutaBusqueda: null,
    });
  }

  cambiarRuta(rutaBusqueda: number | null): void {
    if (this.bloqueado) {
      return;
    }

    const ruta = this.rutasDisponibles.find(
      item => item.id === rutaBusqueda,
    );

    // Evita conservar una ruta incompatible con la zona.
    if (rutaBusqueda !== null && !ruta) {
      return;
    }

    this.filtrosChange.emit({
      ...this.filtros,
      rutaBusqueda,
      zonaBusqueda:
        this.filtros.zonaBusqueda ??
        ruta?.id_zona ??
        null,
    });
  }

  // *********************************************************
  // ACCIONES
  // *********************************************************

  solicitarConsulta(formularioValido: boolean): void {
    if (this.bloqueado || !formularioValido) {
      return;
    }

    // La validación completa del período permanece en el padre.
    this.consultar.emit();
  }

  solicitarRestablecer(): void {
    if (!this.bloqueado) {
      this.restablecer.emit();
    }
  }

  // *********************************************************
  // ETIQUETAS
  // *********************************************************

  etiqueta(valor: string): string {
    const etiquetas: Record<string, string> = {
      MANANA: 'Mañana',
      TARDE: 'Tarde',
      NOCHE: 'Noche',
      KG: 'Kilogramos',
      TONELADA: 'Toneladas',
      LITRO: 'Litros',
      M3: 'Metros cúbicos',
      CRITICA: 'Crítica',
    };

    const texto = etiquetas[valor];

    if (texto) {
      return texto;
    }

    const normalizado = valor
      .replace(/_/g, ' ')
      .toLowerCase();

    return (
      normalizado.charAt(0).toUpperCase() +
      normalizado.slice(1)
    );
  }
}
