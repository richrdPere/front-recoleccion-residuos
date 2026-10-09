import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';

// Interfaces
import { DashboardResumenFilters, DashboardProgramacionesFilters, DashboardRecoleccionesFilters, DashboardVehiculosFilters, DashboardRendimientoRutasFilters, DashboardTendenciasFilters } from '../../interfaces';

// Componentes
import { DashboardResumenComponent } from '../components/dashboard-resumen/dashboard-resumen.component';
import { DashboardProgramacionesComponent } from '../components/dashboard-programaciones/dashboard-programaciones.component';
import { DashboardRecoleccionesComponent } from '../components/dashboard-recolecciones/dashboard-recolecciones.component';
import { DashboardVehiculosComponent } from '../components/dashboard-vehiculos/dashboard-vehiculos.component';
import { DashboardRendimientoRutasComponent } from '../components/dashboard-rendimiento-rutas/dashboard-rendimiento-rutas.component';
import { DashboardTendenciasComponent } from '../components/dashboard-tendencias/dashboard-tendencias.component';

interface FiltroVisible {
  clave: string;
  etiqueta: string;
  valor: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    DashboardResumenComponent,
    DashboardProgramacionesComponent,
    DashboardRecoleccionesComponent,
    DashboardVehiculosComponent,
    DashboardRendimientoRutasComponent,
    DashboardTendenciasComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {

  // ================================
  // Filtros compartidos
  // ================================
  filtrosAplicados: DashboardResumenFilters = {};
  filtrosVisibles: FiltroVisible[] = [];

  // Cada sección recibe su propia referencia.
  filtrosResumen: DashboardResumenFilters = {};

  filtrosProgramaciones: DashboardProgramacionesFilters = {};

  filtrosRecolecciones: DashboardRecoleccionesFilters = {};

  filtrosVehiculos: DashboardVehiculosFilters = {};

  filtrosRendimientoRutas: DashboardRendimientoRutasFilters = {};

  filtrosTendencias: DashboardTendenciasFilters = {};

  // Actualización compartida
  actualizacionDashboard = 0;

  constructor(
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.sincronizarFiltros();
  }

  // ================================
  // Methods
  // ================================
  actualizarDashboard(): void {
    // Los hijos detectan el cambio mediante ngOnChanges.
    // No modifica los filtros ni la página actual de rendimiento.
    this.actualizacionDashboard++;
    this.cdr.markForCheck();
  }

  aplicarFiltros(filtros: DashboardResumenFilters): void {
    this.filtrosAplicados = { ...filtros };

    this.sincronizarFiltros();
    this.cdr.markForCheck();

    // No incrementamos actualizacionDashboard aquí:
    // las nuevas referencias de filtros ya disparan las consultas.
  }

  limpiarFiltros(): void {
    this.aplicarFiltros({});
  }

  // ================================
  // Helpers methods
  // ================================
  private sincronizarFiltros(): void {
    this.filtrosResumen = {
      ...this.filtrosAplicados,
    };

    this.filtrosProgramaciones = {
      ...this.filtrosAplicados,
    };

    this.filtrosRecolecciones = {
      ...this.filtrosAplicados,
    };

    this.filtrosVehiculos = {
      ...this.filtrosAplicados,
    };

    this.filtrosTendencias = {
      ...this.filtrosAplicados,
    };

    // Al aplicar nuevos filtros, rendimiento vuelve
    // a la primera página. El hijo controla su navegación.
    this.filtrosRendimientoRutas = {
      ...this.filtrosAplicados,
      page: 1,
    };

    this.filtrosVisibles = this.obtenerFiltrosVisibles();
  }

  private obtenerFiltrosVisibles(): FiltroVisible[] {
    return Object.entries(this.filtrosAplicados)
      .filter(
        ([, valor]) =>
          valor !== null &&
          valor !== undefined &&
          String(valor).trim() !== '',
      )
      .map(([clave, valor]) => ({
        clave,
        etiqueta: this.formatearEtiqueta(clave),
        valor: String(valor),
      }));
  }

  private formatearEtiqueta(clave: string): string {
    const etiquetas: Record<string, string> = {
      id_zona: 'ID de zona',
      id_ruta: 'ID de ruta',
      id_vehiculo: 'ID de vehículo',
      agrupacion: 'Agrupación',
    };

    if (etiquetas[clave]) {
      return etiquetas[clave];
    }

    const texto = clave
      .replace(/_/g, ' ')
      .toLowerCase();

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
